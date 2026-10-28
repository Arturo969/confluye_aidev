import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_ADAPTER_MARKER,
  DEMO_DEFAULT_DELAY_MS,
  createDemoSubmitter,
  parseDemoOptions,
} from '../../src/lib/form/adapters/demo';
import { createSubmitter } from '../../src/lib/form/factory';
import type { ContactPayload } from '../../src/lib/form/payload';

const payload = { schemaVersion: 1 } as ContactPayload;

describe('parseDemoOptions', () => {
  it('por defecto: ok con latencia de 800 ms', () => {
    expect(parseDemoOptions('')).toEqual({ outcome: 'ok', delayMs: DEMO_DEFAULT_DELAY_MS });
    expect(DEMO_DEFAULT_DELAY_MS).toBe(800);
  });

  it('lee demo-outcome y demo-delay de la query', () => {
    expect(parseDemoOptions('?demo-outcome=server&demo-delay=0')).toEqual({
      outcome: 'server',
      delayMs: 0,
    });
  });

  it('ignora valores desconocidos o fuera de rango', () => {
    expect(parseDemoOptions('?demo-outcome=hack&demo-delay=99999')).toEqual({
      outcome: 'ok',
      delayMs: DEMO_DEFAULT_DELAY_MS,
    });
    expect(parseDemoOptions('?demo-delay=-5').delayMs).toBe(DEMO_DEFAULT_DELAY_MS);
    expect(parseDemoOptions('?demo-delay=abc').delayMs).toBe(DEMO_DEFAULT_DELAY_MS);
  });
});

describe('createDemoSubmitter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const run = async (search: string) => {
    const submitter = createDemoSubmitter(parseDemoOptions(search));
    const pending = submitter.submit(payload, { signal: new AbortController().signal });
    await vi.advanceTimersByTimeAsync(DEMO_DEFAULT_DELAY_MS);
    return pending;
  };

  it.each([
    ['', { kind: 'ok' }],
    ['?demo-outcome=validation', { kind: 'validation', fieldErrors: { email: 'invalid' } }],
    ['?demo-outcome=captcha', { kind: 'validation', fieldErrors: {}, reason: 'captcha' }],
    ['?demo-outcome=rate_limited', { kind: 'rate_limited', retryAfterSec: 60 }],
    ['?demo-outcome=network', { kind: 'network' }],
    ['?demo-outcome=server', { kind: 'server', status: 500 }],
  ])('%s → resultado de la tabla de api/README', async (search, expected) => {
    await expect(run(search)).resolves.toEqual(expected);
  });

  it('no hace ninguna petición de red', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await run('');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('timeout: no resuelve hasta que se aborta la señal', async () => {
    const controller = new AbortController();
    const submitter = createDemoSubmitter(parseDemoOptions('?demo-outcome=timeout'));
    let settled = false;
    const pending = submitter.submit(payload, { signal: controller.signal }).then((r) => {
      settled = true;
      return r;
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(settled).toBe(false);
    controller.abort();
    await expect(pending).resolves.toEqual({ kind: 'timeout' });
  });

  it('si la señal se aborta durante la latencia simulada, devuelve timeout', async () => {
    const controller = new AbortController();
    const pending = createDemoSubmitter(parseDemoOptions('')).submit(payload, {
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).resolves.toEqual({ kind: 'timeout' });
  });

  it('se identifica como demo y lleva el marcador que busca la guardia de build', () => {
    expect(createDemoSubmitter(parseDemoOptions('')).id).toBe('demo');
    expect(DEMO_ADAPTER_MARKER).toMatch(/demo/);
  });
});

describe('createSubmitter', () => {
  it('devuelve el adaptador demo', () => {
    expect(createSubmitter({ adapter: 'demo', search: '' }).id).toBe('demo');
  });

  it.each(['formspree', 'web3forms', 'netlify'] as const)(
    '%s aún no está implementado (T-031) y falla con un mensaje claro',
    (adapter) => {
      expect(() => createSubmitter({ adapter, search: '' })).toThrow(/T-031/);
    },
  );
});
