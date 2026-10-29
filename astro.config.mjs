// @ts-check
import { defineConfig, envField } from 'astro/config';
import { buildGuard } from './src/integrations/build-guard';

// site/base llegan por entorno (ADR-0004): GitHub Pages usa una subruta; producción, la raíz.
const site = process.env.SITE_URL || 'http://localhost:4321';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [buildGuard()],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  env: {
    schema: {
      SITE_ENV: envField.enum({
        context: 'server',
        access: 'public',
        values: ['development', 'preview', 'production'],
        default: 'development',
      }),
      // Formulario (ADR-0003): solo claves públicas; nunca secretos en cliente.
      PUBLIC_FORM_ADAPTER: envField.enum({
        context: 'client',
        access: 'public',
        values: ['demo', 'formspree', 'web3forms', 'netlify'],
        default: 'demo',
      }),
      PUBLIC_FORM_ENDPOINT: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        url: true,
      }),
      PUBLIC_CAPTCHA_PROVIDER: envField.enum({
        context: 'client',
        access: 'public',
        values: ['none', 'turnstile', 'hcaptcha'],
        default: 'none',
      }),
      PUBLIC_CAPTCHA_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
});
