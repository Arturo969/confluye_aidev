import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContactPayload } from '../../src/lib/form/payload';
import { createRateLimiter } from '../../src/lib/form/rate-limit';
import {
  FORM_TIMEOUT_MS,
  submitWithTimeout,
  type FormSubmitter,
  type SubmitResult,
} from '../../src/lib/form/submitter';

const payload = { schemaVersion: 1 } as ContactPayload;

const submitterReturning = (result: SubmitResult): FormSubmitter => ({
  id: 'demo',
  submit: () => Promise.resolve(result),
});

describe('submitWithTimeout', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('usa 10 s como timeout por defecto', () => {
    expect(FORM_TIMEOUT_MS).toBe(10_000);
  });

  it('devuelve el resultado del adaptador', async () => {
    await expect(submitWithTimeout(submitterReturning({ kind: 'ok' }), payload)).resolves.toEqual({
      kind: 'ok',
    });
    await expect(
      submitWithTimeout(submitterReturning({ kind: 'server', status: 500 }), payload),
    ).resolves.toEqual({ kind: 'server', status: 500 });
  });

  it('aborta y devuelve timeout si no hay respuesta en 10 s', async () => {
    let receivedSignal: AbortSignal | undefined;
    const hanging: FormSubmitter = {
      id: 'demo',
      submit: (_p, { signal }) => {
        receivedSignal = signal;
        return new Promise(() => {});
      },
    };
    const pending = submitWithTimeout(hanging, payload);
    await vi.advanceTimersByTimeAsync(FORM_TIMEOUT_MS - 1);
    expect(receivedSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toEqual({ kind: 'timeout' });
    expect(receivedSignal?.aborted).toBe(true);
  });

  it('si un adaptador lanza, devuelve network sin propagar el error', async () => {
    const throwing: FormSubmitter = { id: 'demo', submit: () => Promise.reject(new Error('x')) };
    await expect(submitWithTimeout(throwing, payload)).resolves.toEqual({ kind: 'network' });
  });

  it('limpia el temporizador cuando el adaptador responde a tiempo', async () => {
    await submitWithTimeout(submitterReturning({ kind: 'ok' }), payload);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('createRateLimiter', () => {
  it('permite 3 envíos por minuto y bloquea el 4.º', () => {
    let now = 0;
    const limiter = createRateLimiter(3, 60_000, () => now);
    expect([limiter.tryAcquire(), limiter.tryAcquire(), limiter.tryAcquire()]).toEqual([
      true,
      true,
      true,
    ]);
    now = 59_999;
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('libera cupo cuando pasa la ventana', () => {
    let now = 0;
    const limiter = createRateLimiter(3, 60_000, () => now);
    limiter.tryAcquire();
    limiter.tryAcquire();
    limiter.tryAcquire();
    now = 60_000;
    expect(limiter.tryAcquire()).toBe(true);
  });
});
