import type { ContactPayload } from './payload';
import type { FieldErrors } from './schema';

export const FORM_TIMEOUT_MS = 10_000;

/** Resultado tipado del envío (api/README.md §1). Los adaptadores nunca lanzan. */
export type SubmitResult =
  | { kind: 'ok' }
  | { kind: 'validation'; fieldErrors: FieldErrors; reason?: 'captcha' }
  | { kind: 'rate_limited'; retryAfterSec?: number }
  | { kind: 'network' }
  | { kind: 'timeout' }
  | { kind: 'server'; status?: number };

export type SubmitterId = 'demo' | 'formspree' | 'web3forms' | 'netlify';

export interface FormSubmitter {
  readonly id: SubmitterId;
  submit(payload: ContactPayload, opts: { signal: AbortSignal }): Promise<SubmitResult>;
}

/** Envía con límite de tiempo: al vencer aborta la señal y devuelve `timeout` (distinto de `network`). */
export async function submitWithTimeout(
  submitter: FormSubmitter,
  payload: ContactPayload,
  timeoutMs: number = FORM_TIMEOUT_MS,
): Promise<SubmitResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<SubmitResult>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({ kind: 'timeout' });
    }, timeoutMs);
  });
  // Red de seguridad: un adaptador que lance se trata como fallo de red, sin propagar el error.
  const attempt = submitter
    .submit(payload, { signal: controller.signal })
    .catch((): SubmitResult => ({ kind: 'network' }));
  try {
    return await Promise.race([attempt, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
