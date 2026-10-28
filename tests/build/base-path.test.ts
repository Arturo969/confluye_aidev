import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const ASTRO_BIN = join('node_modules', 'astro', 'bin', 'astro.mjs');
// Vitest inyecta variables de Vite en process.env; el build hijo no debe heredarlas.
const VITE_INJECTED = /^(BASE_URL|MODE|DEV|PROD|SSR|VITEST.*)$/;
const CONTROLLED = new Set(['BASE_PATH', 'SITE_ENV']);
const outDirs: string[] = [];

function build(overrides: Record<string, string> = {}): string {
  const outDir = mkdtempSync(join(tmpdir(), 'confluye-build-'));
  outDirs.push(outDir);
  const inherited = Object.entries(process.env).filter(
    ([key]) => !CONTROLLED.has(key) && !VITE_INJECTED.test(key),
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
  it('producción es indexable, sin banner de prueba', () => {
    const out = build({ SITE_ENV: 'production' });
    const html = read(out, 'index.html');
    expect(html).not.toContain('noindex');
    expect(html).not.toContain('Versión de prueba');
    expect(read(out, 'robots.txt')).not.toMatch(/Disallow: \/\s*$/m);
  });

  it('preview no es indexable y muestra el banner', () => {
    const out = build({ SITE_ENV: 'preview' });
    expect(read(out, 'index.html')).toContain('noindex, nofollow');
    expect(read(out, 'en', 'index.html')).toContain('Preview version');
    expect(read(out, 'robots.txt')).toMatch(/Disallow: \/\s*$/m);
  });
});
