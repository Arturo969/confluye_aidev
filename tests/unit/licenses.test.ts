import { describe, expect, it } from 'vitest';
import { evaluateLicense } from '../../scripts/check-licenses.mjs';

describe('evaluateLicense', () => {
  it('acepta licencias permisivas de la lista', () => {
    expect(evaluateLicense('astro', 'MIT').ok).toBe(true);
    expect(evaluateLicense('x', 'Apache-2.0').ok).toBe(true);
  });

  it('rechaza licencias fuera de la lista o ausentes', () => {
    expect(evaluateLicense('x', 'GPL-3.0-only').ok).toBe(false);
    expect(evaluateLicense('x', undefined).ok).toBe(false);
  });

  it('acepta OR si alguna opción está permitida', () => {
    expect(evaluateLicense('x', '(MIT OR GPL-3.0-only)').ok).toBe(true);
  });

  it('exige que todas las partes de un AND estén permitidas', () => {
    expect(evaluateLicense('x', 'MIT AND GPL-3.0-only').ok).toBe(false);
    expect(evaluateLicense('x', 'MIT AND ISC').ok).toBe(true);
  });

  it('aplica excepciones documentadas por paquete (sharp, solo en build)', () => {
    const result = evaluateLicense('@img/sharp-libvips-linux-x64', 'LGPL-3.0-or-later');
    expect(result.ok).toBe(true);
    expect(result.reason).toMatch(/excepción/i);
  });
});
