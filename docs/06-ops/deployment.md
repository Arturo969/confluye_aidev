# Despliegue — confluye

- **Entornos**: local (`npm run dev`) · preview en GitHub Pages (`https://arturo969.github.io/confluye_aidev/`, formulario demo, `noindex`; T-004) · producción en Vercel o Netlify (pendiente, M5).
- **Artefacto**: sitio estático en `dist/` (`npm run build`); el mismo build sirve en cualquier hosting estático.
- **Configuración por entorno** (variables, nunca secretos en cliente; tipadas en `astro.config.mjs` → `env.schema`):

| Variable | Valores | Por defecto | Uso |
|----------|---------|-------------|-----|
| `SITE_URL` / `BASE_PATH` | URL / ruta | `http://localhost:4321` / `/` | `site` y `base` de Astro (ADR-0004) |
| `SITE_ENV` | `development` · `preview` · `production` | `development` | solo `production` se indexa y activa la guardia |
| `PUBLIC_FORM_ADAPTER` | `demo` · `formspree` · `web3forms` · `netlify` | `demo` | adaptador del formulario (ADR-0003); reales pendientes de T-031 |
| `PUBLIC_FORM_ENDPOINT` | URL `https://` | — | obligatorio en producción |
| `PUBLIC_CAPTCHA_PROVIDER` | `none` · `turnstile` · `hcaptcha` | `none` | producción exige ≠ `none` |
| `PUBLIC_CAPTCHA_SITE_KEY` | clave pública | — | si hay captcha |

- **Guardia de producción** (`src/integrations/build-guard.ts`, SR-12): con `SITE_ENV=production` el build **falla** si el adaptador es `demo`, falta el endpoint `https://` o no hay captcha; al terminar escanea `dist/` y falla si encuentra el adaptador demo, `TODO` o placeholders tipo `[RUC]`.
- **Repositorio**: `https://github.com/Arturo969/confluye_aidev` · rama `main` protegida (PR + checks obligatorios).

## CI — `.github/workflows/ci.yml` (T-003)
Se ejecuta en cada PR y en push a `main`. Permisos `contents: read`; acciones fijadas por SHA; checkout sin credenciales persistidas.

| Job | Qué hace | Bloquea si… |
|-----|----------|-------------|
| `quality` | `npm ci`, lint (eslint+stylelint+prettier), typecheck, unit + cobertura, build, test de build con/sin `BASE_PATH` | cualquier paso falla o la cobertura de `src/lib` < 90 % |
| `e2e` | Playwright (Chromium móvil) sobre el build | un test falla (sube `playwright-report` 7 días) |
| `supply-chain` | `npm audit --audit-level=high` + `npm run licenses` | vulnerabilidad alta/crítica o licencia no permitida |
| `secrets` | gitleaks sobre todo el historial | se detecta un secreto |
| `workflow-lint` | actionlint + zizmor | hallazgos en los workflows |
| `dependency-review` | solo en PR: dependencias nuevas con vulnerabilidad alta | severidad ≥ high |

Dependabot (`.github/dependabot.yml`): npm y github-actions semanal, agrupado, con `cooldown` de 7 días.

## Preview — `.github/workflows/deploy-preview.yml` (T-004)
- Se ejecuta en cada push a `main` (tras fusionar un PR con CI verde) o a mano (`workflow_dispatch`).
- Job `build`: `withastro/action` con `SITE_ENV=preview`, `SITE_URL=https://arturo969.github.io`, `BASE_PATH=/confluye_aidev/`, `PUBLIC_FORM_ADAPTER=demo`.
- Job `deploy`: único con permisos `pages: write` + `id-token: write`; entorno `github-pages` (solo acepta `main`).
- Fuera de producción el sitio lleva `<meta name="robots" content="noindex, nofollow">`, `robots.txt` con `Disallow: /` y banner "Versión de prueba" (`src/lib/config/site-env.ts`, SR-05).
- Requisito único: Settings → Pages → Source = **GitHub Actions**.

- **Estrategia de despliegue**: atómica (el hosting estático publica el build completo).
- **Rollback (preview)**: `git revert <commit>` en una rama + PR → al fusionar se republica; o Actions → deploy-preview → "Run workflow" sobre un commit anterior. Objetivo < 10 min. Producción: T-032.
- **Migraciones de BD**: no aplica (sin BD).
