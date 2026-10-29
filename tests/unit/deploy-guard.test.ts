import { describe, expect, it } from 'vitest';
import { assertDeployConfig, findDistViolations } from '../../src/lib/config/deploy-guard';
import { DEMO_ADAPTER_MARKER } from '../../src/lib/form/markers';

const validProduction = {
  SITE_ENV: 'production',
  PUBLIC_FORM_ADAPTER: 'formspree',
  PUBLIC_FORM_ENDPOINT: 'https://formspree.io/f/abc',
  PUBLIC_CAPTCHA_PROVIDER: 'turnstile',
};

describe('assertDeployConfig', () => {
  it('no exige nada fuera de producción', () => {
    expect(() => assertDeployConfig({ SITE_ENV: 'preview' })).not.toThrow();
    expect(() => assertDeployConfig({})).not.toThrow();
  });

  it('acepta una configuración de producción completa', () => {
    expect(() => assertDeployConfig(validProduction)).not.toThrow();
  });

  it('rechaza producción con el adaptador demo (o sin adaptador)', () => {
    expect(() => assertDeployConfig({ ...validProduction, PUBLIC_FORM_ADAPTER: 'demo' })).toThrow(
      /demo/,
    );
    expect(() =>
      assertDeployConfig({ ...validProduction, PUBLIC_FORM_ADAPTER: undefined }),
    ).toThrow(/demo/);
  });

  it('exige endpoint https', () => {
    expect(() => assertDeployConfig({ ...validProduction, PUBLIC_FORM_ENDPOINT: '' })).toThrow(
      /PUBLIC_FORM_ENDPOINT/,
    );
    expect(() =>
      assertDeployConfig({ ...validProduction, PUBLIC_FORM_ENDPOINT: 'http://formspree.io/f/a' }),
    ).toThrow(/https/);
    expect(() =>
      assertDeployConfig({ ...validProduction, PUBLIC_FORM_ENDPOINT: 'no es una url' }),
    ).toThrow(/https/);
  });

  it('exige captcha', () => {
    expect(() =>
      assertDeployConfig({ ...validProduction, PUBLIC_CAPTCHA_PROVIDER: 'none' }),
    ).toThrow(/captcha/i);
  });

  it('rechaza producción si algún idioma sigue como borrador (RN-07)', () => {
    expect(() => assertDeployConfig(validProduction, ['en'])).toThrow(/"en".*borrador/);
    expect(() => assertDeployConfig({ SITE_ENV: 'preview' }, ['en'])).not.toThrow();
  });

  it('enumera todos los problemas a la vez', () => {
    try {
      assertDeployConfig({ SITE_ENV: 'production' });
      expect.unreachable();
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toMatch(/demo/);
      expect(message).toMatch(/PUBLIC_FORM_ENDPOINT/);
      expect(message).toMatch(/captcha/i);
    }
  });
});

describe('findDistViolations', () => {
  it('no reporta nada en archivos limpios', () => {
    expect(findDistViolations([{ path: 'index.html', content: '<p>[1] nota</p>' }])).toEqual([]);
  });

  it('detecta el adaptador demo en el bundle', () => {
    const violations = findDistViolations([
      { path: '_astro/form.js', content: `const m="${DEMO_ADAPTER_MARKER}"` },
    ]);
    expect(violations).toEqual([expect.stringMatching(/_astro\/form\.js.*demo/)]);
  });

  it('detecta placeholders legales y TODO en el HTML', () => {
    const violations = findDistViolations([
      { path: 'privacidad/index.html', content: '<p>RUC: [RUC]</p>' },
      { path: 'index.html', content: '<footer>TODO: domicilio</footer>' },
    ]);
    expect(violations).toHaveLength(2);
  });

  it('no busca placeholders en archivos JS (solo el marcador demo)', () => {
    expect(findDistViolations([{ path: 'a.js', content: 'x=[ABC]' }])).toEqual([]);
  });
});
