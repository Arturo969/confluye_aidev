import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const ASTRO_BIN = join('node_modules', 'astro', 'bin', 'astro.mjs');
// Vitest inyecta variables de Vite en process.env; el build hijo no debe heredarlas.
const VITE_INJECTED = /^(BASE_URL|MODE|DEV|PROD|SSR|VITEST.*)$/;
const outDirs: string[] = [];

function build(basePath?: string): string {
  const outDir = mkdtempSync(join(tmpdir(), 'confluye-build-'));
  outDirs.push(outDir);
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'BASE_PATH' && !VITE_INJECTED.test(key)),
  );
  if (basePath) env['BASE_PATH'] = basePath;
  execFileSync(process.execPath, [ASTRO_BIN, 'build', '--outDir', outDir], { env, stdio: 'pipe' });
  return outDir;
}

afterAll(() => {
  for (const dir of outDirs) rmSync(dir, { recursive: true, force: true });
});

describe('build con y sin BASE_PATH', () => {
  it('sin BASE_PATH genera es en la raíz y en en /en/', () => {
    const out = build();
    expect(readFileSync(join(out, 'index.html'), 'utf8')).toContain('lang="es"');
    expect(readFileSync(join(out, 'en', 'index.html'), 'utf8')).toContain('lang="en"');
  });

  it('con BASE_PATH los enlaces internos llevan el prefijo', () => {
    const out = build('/confluye_page_aidev/');
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    expect(html).toContain('href="/confluye_page_aidev/en/"');
    expect(html).not.toMatch(/href="\/en\/"/);
  });
});
