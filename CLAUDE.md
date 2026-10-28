# confluye

Proyecto gestionado con **AIDEV** (track: critical). Estado y siguiente paso: `docs/STATE.md` → `/aidev:status`.

## Contexto rápido
- Facetas: interfaz=web, despliegue=cloud, datos=sin-estado, arquitectura=script, ia=ninguna, integracion=apis-terceros, restricciones=, regulacion=datos-personales, stack=astro/typescript/css
- Perfiles: web-frontend, integrations
- Stack: Astro 7.4.x (SSG, i18n es/en) · TypeScript strictest · CSS propio con tokens (mobile-first, solo min-width) · JS vanilla mínimo · Node 24 LTS · npm. Formulario vía puerto `FormSubmitter` (adaptador `demo` hoy). Preview: GitHub Pages (Actions); producción: Vercel o Netlify (pendiente). Ver ADR-0002..0004.

## Comandos del proyecto
- Instalar: `npm ci`
- Ejecutar: `npm run dev` · build: `npm run build` (`astro check && astro build`) · `npm run preview`
- Licencias: `npm run licenses` · CI y despliegue: `docs/06-ops/deployment.md`
- Tests: `npm test` (vitest) · `npm run test:build` (build real con/sin `BASE_PATH`) · e2e + a11y: `npm run e2e` (Playwright + axe, 3 viewports) · `npm run lhci` (Lighthouse CI)
- Lint / tipos: `npm run lint` (eslint + stylelint + prettier) · `npm run lint:fix` · `npm run format` · `npm run typecheck`. Reglas clave (probadas en `tests/unit/lint-rules.test.ts`): no-unsanitized, no-console en `src/`, adaptadores solo vía `factory`, no-cycle, solo `min-width` en media queries
- Env: `PUBLIC_FORM_ADAPTER` (`demo`), `PUBLIC_FORM_ENDPOINT`, `SITE_ENV` (`preview`/`production`), `SITE_URL`, `BASE_PATH` (preview: `https://arturo969.github.io` + `/confluye_aidev/`) — ver `.env.example`. En Git Bash, exporta `MSYS_NO_PATHCONV=1` al pasar `BASE_PATH` (si no, MSYS lo convierte en ruta de Windows)

## Convenciones
- Modo plan antes de cambios no triviales. TDD: test que falla → código → refactor.
- Conventional Commits; ramas `feat/`, `fix/`, `chore/`. Nunca push directo a `main`.
- Secretos solo en variables de entorno; `.env.example` documenta las claves.
- Decisiones de arquitectura → ADR (`docs/02-architecture/adr/`).
- Toda API externa: consultar context7 antes de usarla.

## Mapa de documentación
`docs/README.md` (índice). No leas docs completas sin necesidad: abre solo la sección relevante.
