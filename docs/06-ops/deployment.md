# Despliegue — confluye

- **Entornos**: local (`npm run dev`) · preview en GitHub Pages (`https://arturo969.github.io/confluye_aidev/`, formulario demo, `noindex`; T-004) · producción en Vercel o Netlify (pendiente, M5).
- **Artefacto**: sitio estático en `dist/` (`npm run build`); el mismo build sirve en cualquier hosting estático.
- **Configuración por entorno** (variables, nunca secretos en cliente): `SITE_URL`, `BASE_PATH`, `SITE_ENV`, `PUBLIC_FORM_ADAPTER`, `PUBLIC_FORM_ENDPOINT` — ver `.env.example` y ADR-0004.
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

- **Estrategia de despliegue**: atómica (el hosting estático publica el build completo).
- **Rollback**: re-ejecutar el deploy del último commit bueno de `main` (o `git revert` + push); objetivo < 10 min. Se detalla en T-004/T-032.
- **Migraciones de BD**: no aplica (sin BD).
