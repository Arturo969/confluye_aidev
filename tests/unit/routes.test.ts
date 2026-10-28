import { describe, expect, it } from 'vitest';
import { LOCALES, DEFAULT_LOCALE, localePath } from '../../src/lib/i18n/routes';

describe('localePath', () => {
  it('expone es como idioma por defecto y en como secundario', () => {
    expect(DEFAULT_LOCALE).toBe('es');
    expect(LOCALES).toEqual(['es', 'en']);
  });

  it('no añade prefijo al idioma por defecto', () => {
    expect(localePath('es')).toBe('/');
    expect(localePath('es', 'privacidad')).toBe('/privacidad/');
  });

  it('añade prefijo /en/ al inglés', () => {
    expect(localePath('en')).toBe('/en/');
    expect(localePath('en', 'privacy')).toBe('/en/privacy/');
  });

  it('respeta base con o sin barra final', () => {
    expect(localePath('es', '', '/confluye/')).toBe('/confluye/');
    expect(localePath('en', '', '/confluye')).toBe('/confluye/en/');
    expect(localePath('en', 'privacy', '/confluye/')).toBe('/confluye/en/privacy/');
  });

  it('normaliza barras sobrantes en la ruta', () => {
    expect(localePath('es', '/privacidad/')).toBe('/privacidad/');
    expect(localePath('en', '//privacy')).toBe('/en/privacy/');
  });
});
