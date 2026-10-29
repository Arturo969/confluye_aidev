import { DEMO_ADAPTER_MARKER } from '../markers';
import type { FormSubmitter, SubmitResult } from '../submitter';

export { DEMO_ADAPTER_MARKER };
export const DEMO_DEFAULT_DELAY_MS = 800;
const MAX_DELAY_MS = 5_000;

const OUTCOMES = {
  ok: { kind: 'ok' },
  validation: { kind: 'validation', fieldErrors: { email: 'invalid' } },
  captcha: { kind: 'validation', fieldErrors: {}, reason: 'captcha' },
  rate_limited: { kind: 'rate_limited', retryAfterSec: 60 },
  network: { kind: 'network' },
  server: { kind: 'server', status: 500 },
} as const satisfies Record<string, SubmitResult>;

export type DemoOutcome = keyof typeof OUTCOMES | 'timeout';

export interface DemoOptions {
  outcome: DemoOutcome;
  delayMs: number;
}

const isOutcome = (value: string | null): value is DemoOutcome =>
  value === 'timeout' || (value !== null && Object.hasOwn(OUTCOMES, value));

/** Lee `?demo-outcome=` y `?demo-delay=` (api/README §3). Valores desconocidos → por defecto. */
export function parseDemoOptions(search: string): DemoOptions {
  const params = new URLSearchParams(search);
  const outcome = params.get('demo-outcome');
  const delay = Number(params.get('demo-delay') ?? Number.NaN);
  const validDelay = Number.isInteger(delay) && delay >= 0 && delay <= MAX_DELAY_MS;
  return {
    outcome: isOutcome(outcome) ? outcome : 'ok',
    delayMs: validDelay ? delay : DEMO_DEFAULT_DELAY_MS,
  };
}

/** Adaptador sin red para dev y preview: simula la respuesta del proveedor. */
export function createDemoSubmitter(options: DemoOptions): FormSubmitter & { marker: string } {
  return {
    id: 'demo',
    marker: DEMO_ADAPTER_MARKER,
    submit: (_payload, { signal }) =>
      new Promise<SubmitResult>((resolve) => {
        const timeout: SubmitResult = { kind: 'timeout' };
        if (signal.aborted) return resolve(timeout);
        signal.addEventListener('abort', () => resolve(timeout), { once: true });
        if (options.outcome === 'timeout') return;
        const result = OUTCOMES[options.outcome];
        setTimeout(() => resolve(result), options.delayMs);
      }),
  };
}
