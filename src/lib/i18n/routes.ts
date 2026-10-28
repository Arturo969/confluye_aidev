export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '');

/**
 * Ruta interna con barra final (trailingSlash: 'always'). El idioma por defecto
 * no lleva prefijo (prefixDefaultLocale: false) y `base` se antepone tal cual.
 */
export function localePath(locale: Locale, path = '', base = '/'): string {
  const segments = [
    trimSlashes(base),
    locale === DEFAULT_LOCALE ? '' : locale,
    trimSlashes(path),
  ].filter(Boolean);
  return segments.length ? `/${segments.join('/')}/` : '/';
}
