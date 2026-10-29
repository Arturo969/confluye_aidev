// Carga tipada del contenido por idioma. Se ejecuta en build (páginas .astro), nunca en cliente.
import { contentSchema, siteSchema, type Content, type Site } from '../../content/schema';
import siteJson from '../../content/site.json';
import type { Locale } from './routes';

const SECTIONS = [
  'meta',
  'seo',
  'nav',
  'hero',
  'concept',
  'value',
  'audiences',
  'services',
  'approach',
  'form',
  'footer',
] as const;

const files = import.meta.glob<{ default: unknown }>('../../content/{es,en}/*.json', {
  eager: true,
});

function rawContent(locale: Locale): Record<string, unknown> {
  return Object.fromEntries(
    SECTIONS.map((section) => [section, files[`../../content/${locale}/${section}.json`]?.default]),
  );
}

const cache = new Map<Locale, Content>();

/** Contenido validado; un archivo ausente o una clave errónea hacen fallar el build. */
export function getContent(locale: Locale): Content {
  const cached = cache.get(locale);
  if (cached) return cached;
  const parsed = contentSchema.safeParse(rawContent(locale));
  if (!parsed.success) {
    throw new Error(`Contenido "${locale}" inválido:\n${parsed.error.message}`);
  }
  cache.set(locale, parsed.data);
  return parsed.data;
}

/** Datos no traducibles (email, titular legal, redes). */
export function getSite(): Site {
  return siteSchema.parse(siteJson);
}

/** Rutas de todas las hojas ("a.b", "c.0.d"): base del test de paridad es/en. */
export function keyPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}
