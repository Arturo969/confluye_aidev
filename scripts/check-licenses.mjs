// Verifica las licencias de las dependencias de producción (RNF-21). Sin dependencias externas:
// usa `npm ls` y el campo `license` de cada package.json. Uso: node scripts/check-licenses.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ALLOWED = new Set([
  'MIT',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'MPL-2.0',
  'CC0-1.0',
  '0BSD',
]);

// Excepciones revisadas (registradas en docs/01-requirements/compliance.md).
export const EXCEPTIONS = [
  {
    pattern: /^@img\/sharp-/,
    reason:
      'excepción: binarios de sharp/libvips (LGPL-3.0) usados solo al construir; no se distribuyen en dist/',
  },
];

/** @param {string | undefined} expression */
function isAllowed(expression) {
  if (!expression) return false;
  const expr = expression.trim().replace(/^\((.*)\)$/, '$1');
  if (/\sOR\s/.test(expr)) return expr.split(/\s+OR\s+/).some(isAllowed);
  if (/\sAND\s/.test(expr)) return expr.split(/\s+AND\s+/).every(isAllowed);
  return ALLOWED.has(expr);
}

/**
 * @param {string} name
 * @param {string | undefined} license
 * @returns {{ ok: boolean, reason: string }}
 */
export function evaluateLicense(name, license) {
  if (isAllowed(license)) return { ok: true, reason: license ?? '' };
  const exception = EXCEPTIONS.find((e) => e.pattern.test(name));
  if (exception) return { ok: true, reason: exception.reason };
  return { ok: false, reason: `licencia no permitida: ${license ?? '(sin licencia)'}` };
}

function productionPackageDirs() {
  const args = ['ls', '--omit=dev', '--all', '--parseable'];
  // Vía `npm run licenses`, npm_execpath apunta a npm-cli.js: se invoca con node, sin shell.
  const npmCli = process.env['npm_execpath'];
  const out = npmCli
    ? execFileSync(process.execPath, [npmCli, ...args], { encoding: 'utf8' })
    : execFileSync('npm', args, { encoding: 'utf8', shell: process.platform === 'win32' });
  // La primera línea es el propio proyecto.
  return out.split(/\r?\n/).filter(Boolean).slice(1);
}

function main() {
  const failures = [];
  const seen = new Set();
  for (const dir of productionPackageDirs()) {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    const id = `${pkg.name}@${pkg.version}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const license = typeof pkg.license === 'string' ? pkg.license : pkg.license?.type;
    const result = evaluateLicense(pkg.name, license);
    if (!result.ok) failures.push(`${id}: ${result.reason}`);
  }
  if (failures.length) {
    process.stderr.write(`Licencias no permitidas:\n${failures.join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(`Licencias OK (${seen.size} paquetes de producción).\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
