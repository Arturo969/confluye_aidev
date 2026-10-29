import { ESLint } from 'eslint';
import stylelint from 'stylelint';
import { beforeAll, describe, expect, it } from 'vitest';

// Prueba que las reglas de calidad y seguridad de verdad fallan (T-002, SR-03, SR-11, RF-13).
const eslint = new ESLint();

async function eslintRules(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => m.ruleId ?? m.message);
}

async function stylelintWarnings(code: string, codeFilename: string): Promise<string[]> {
  const { results } = await stylelint.lint({ code, codeFilename });
  return (results[0]?.warnings ?? []).map((w) => w.rule);
}

// Cargar ESLint y Stylelint (config + plugins) tarda segundos con la máquina ocupada:
// se precalienta una vez con margen amplio para que cada test no roce el timeout de 5 s.
beforeAll(async () => {
  await eslint.lintText('export {};\n', { filePath: 'src/warmup.ts' });
  await stylelint.lint({ code: 'a {}\n', codeFilename: 'src/warmup.css' });
}, 60_000);

describe('ESLint', () => {
  it('bloquea innerHTML con datos no confiables (XSS)', async () => {
    const rules = await eslintRules(
      'export function show(el: HTMLElement, name: string) { el.innerHTML = name; }\n',
      'src/scripts/xss.ts',
    );
    expect(rules).toContain('no-unsanitized/property');
  });

  it('bloquea document.write', async () => {
    const rules = await eslintRules(
      'export function w(s: string) { document.write(s); }\n',
      'src/scripts/xss.ts',
    );
    expect(rules).toContain('no-unsanitized/method');
  });

  it('prohíbe console.* en src/ (sin PII en consola)', async () => {
    const rules = await eslintRules(
      'export function log(email: string) { console.log(email); }\n',
      'src/scripts/log.ts',
    );
    expect(rules).toContain('no-console');
  });

  it('impide importar adaptadores del formulario fuera de la fábrica', async () => {
    const code = "import { demo } from '../lib/form/adapters/demo';\nexport const a = demo;\n";
    expect(await eslintRules(code, 'src/scripts/contact-form.ts')).toContain(
      'no-restricted-imports',
    );
    expect(await eslintRules(code, 'src/components/ContactForm.ts')).toContain(
      'no-restricted-imports',
    );
  });

  it('detecta dependencias cíclicas entre módulos', async () => {
    // Fixtures ignoradas por `eslint .`; aquí se lintan a propósito.
    const [result] = await new ESLint({ ignore: false }).lintFiles(['tests/fixtures/cycle/a.ts']);
    expect(result?.messages.map((m) => m.ruleId)).toContain('import-x/no-cycle');
  });

  it('permite que la fábrica importe adaptadores', async () => {
    const rules = await eslintRules(
      "import { demo } from './adapters/demo';\nexport const a = demo;\n",
      'src/lib/form/factory.ts',
    );
    expect(rules).not.toContain('no-restricted-imports');
  });
});

describe('Stylelint (mobile-first)', () => {
  it('prohíbe max-width en media queries', async () => {
    const warnings = await stylelintWarnings(
      '@media (max-width: 768px) { a { color: red; } }\n',
      'src/styles/test.css',
    );
    expect(warnings).toContain('media-feature-name-disallowed-list');
  });

  it('prohíbe la notación de rango (width <= …) que esquiva la regla', async () => {
    const warnings = await stylelintWarnings(
      '@media (width <= 768px) { a { color: red; } }\n',
      'src/styles/test.css',
    );
    expect(warnings).toContain('media-feature-range-notation');
  });

  it('aplica la regla también en el <style> de componentes .astro', async () => {
    const warnings = await stylelintWarnings(
      '<p>hola</p>\n<style>\n  @media (max-width: 768px) {\n    p {\n      color: red;\n    }\n  }\n</style>\n',
      'src/components/Test.astro',
    );
    expect(warnings).toContain('media-feature-name-disallowed-list');
  });

  it('acepta min-width', async () => {
    const warnings = await stylelintWarnings(
      '@media (min-width: 768px) {\n  a {\n    color: red;\n  }\n}\n',
      'src/styles/test.css',
    );
    expect(warnings).toEqual([]);
  });
});
