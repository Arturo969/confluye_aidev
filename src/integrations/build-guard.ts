import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import enMeta from '../content/en/meta.json';
import esMeta from '../content/es/meta.json';
import { assertDeployConfig, findDistViolations } from '../lib/config/deploy-guard';

const DRAFT_LOCALES = Object.entries({ es: esMeta, en: enMeta })
  .filter(([, meta]) => meta.draft)
  .map(([locale]) => locale);

const SCANNED = /\.(html|js|mjs)$/;

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name));
}

/** Bloquea builds de producción sin formulario real o con textos de relleno (ADR-0003, SR-12). */
export function buildGuard(): AstroIntegration {
  const isProductionBuild = () => process.env['SITE_ENV'] === 'production';
  return {
    name: 'confluye-build-guard',
    hooks: {
      'astro:config:setup': ({ command }) => {
        // Los .env no se cargan en el config de Astro: la guardia lee el entorno del proceso.
        if (command === 'build') assertDeployConfig(process.env, DRAFT_LOCALES);
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (!isProductionBuild()) return;
        const root = fileURLToPath(dir);
        const paths = (await listFiles(root)).filter((p) => SCANNED.test(p));
        const files = await Promise.all(
          paths.map(async (p) => ({
            path: relative(root, p).replaceAll('\\', '/'),
            content: await readFile(p, 'utf8'),
          })),
        );
        const violations = findDistViolations(files);
        if (violations.length > 0) {
          throw new Error(`Build de producción bloqueado:\n- ${violations.join('\n- ')}`);
        }
        logger.info(`Guardia de producción OK (${files.length} archivos revisados).`);
      },
    },
  };
}
