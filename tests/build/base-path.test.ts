import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const ASTRO_BIN = join('node_modules', 'astro', 'bin', 'astro.mjs');
// Vitest inyecta variables de Vite en process.env; el build hijo no debe heredarlas.
const VITE_INJECTED = /^(BASE_URL|MODE|DEV|PROD|SSR|VITEST.*)$/;
const CONTROLLED = /^(BASE_PATH|SITE_ENV|PUBLIC_.*)$/;
// Producción ficticia pero válida para la guardia (adaptador real + https + captcha).
const PRODUCTION = {
  SITE_ENV: 'production',
  PUBLIC_FORM_ADAPTER: 'formspree',
  PUBLIC_FORM_ENDPOINT: 'https://formspree.io/f/test',
  PUBLIC_CAPTCHA_PROVIDER: 'turnstile',
};
const outDirs: string[] = [];

function build(overrides: Record<string, string> = {}): string {
  const outDir = mkdtempSync(join(tmpdir(), 'confluye-build-'));
  outDirs.push(outDir);
  const inherited = Object.entries(process.env).filter(
    ([key]) => !CONTROLLED.test(key) && !VITE_INJECTED.test(key),
  );
  const env = { ...Object.fromEntries(inherited), ...overrides };
  execFileSync(process.execPath, [ASTRO_BIN, 'build', '--outDir', outDir], { env, stdio: 'pipe' });
  return outDir;
}

const read = (out: string, ...path: string[]) => readFileSync(join(out, ...path), 'utf8');

afterAll(() => {
  for (const dir of outDirs) rmSync(dir, { recursive: true, force: true });
});

describe('build con y sin BASE_PATH', () => {
  it('sin BASE_PATH genera es en la raíz y en en /en/', () => {
    const out = build();
    expect(read(out, 'index.html')).toContain('lang="es"');
    expect(read(out, 'en', 'index.html')).toContain('lang="en"');
  });

  it('con BASE_PATH los enlaces internos llevan el prefijo', () => {
    const html = read(build({ BASE_PATH: '/confluye_page_aidev/' }), 'index.html');
    expect(html).toContain('href="/confluye_page_aidev/en/"');
    expect(html).not.toMatch(/href="\/en\/"/);
  });
});

describe('modo de sitio (SR-05)', () => {
  it('preview no es indexable y muestra el banner', () => {
    const out = build({ SITE_ENV: 'preview' });
    expect(read(out, 'index.html')).toContain('noindex, nofollow');
    expect(read(out, 'en', 'index.html')).toContain('Preview version');
    expect(read(out, 'robots.txt')).toMatch(/Disallow: \/\s*$/m);
  });
});

// Mientras el inglés sea borrador (RN-07) ningún build de producción puede pasar; el modo
// indexable de producción se cubre en tests/unit/site-env.test.ts.
describe('guardia de producción (SR-12)', () => {
  it('falla si algún idioma sigue como borrador', () => {
    expect(() => build(PRODUCTION)).toThrow(/"en" sigue como borrador/);
  });

  it('falla si producción usa el formulario demo', () => {
    expect(() => build({ ...PRODUCTION, PUBLIC_FORM_ADAPTER: 'demo' })).toThrow(
      /PUBLIC_FORM_ADAPTER es "demo"/,
    );
  });
});
