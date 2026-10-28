# ADR-0004: Hosting — GitHub Pages para preview; producción en Vercel o Netlify (pendiente)

- Estado: Aceptado 2026-10-28 (preview decidida; producción pendiente del cliente) · Fecha: 2026-10-27

## Contexto
- El cliente quiere una preview pública ya, en **GitHub Pages** (project site → subruta `/<repo>/`), y producción futura en **Vercel o Netlify**, sin decidir.
- RNF-10: misma salida estática en los tres, solo cambian variables y archivo de cabeceras. RNF-06: cabeceras completas en producción; en GitHub Pages se acepta desviación (no admite cabeceras propias). RNF-03: CDN, caché inmutable para assets con hash, Brotli/gzip, HTTP/2+.
- Riesgo de suministro: workflows de CI con permisos mínimos y acciones fijadas.

## Opciones consideradas
1. **Preview en GitHub Pages vía GitHub Actions** + producción en Vercel/Netlify con archivos de cabeceras preparados para ambos.
2. Preview directamente en Netlify/Vercel (deploy previews por PR, cabeceras reales desde el día 1): mejor paridad, pero contradice la decisión del cliente y obliga a elegir proveedor ya.
3. Cloudflare Pages (cabeceras con `_headers`, Web Analytics y Turnstile del mismo proveedor): buena opción técnica, fuera de la lista del cliente; queda como alternativa si cambia el criterio.

## Decisión
**Opción 1.**

**Preview — GitHub Pages**
- Workflow `.github/workflows/deploy-preview.yml` (push a `main` + `workflow_dispatch`): job `build` con `withastro/action` (instala con el lockfile, construye y sube el artefacto; o `npm ci && npm run build` + `actions/upload-pages-artifact`) y job `deploy` con `actions/deploy-pages`, entorno `github-pages`. Solo despliega si el workflow de CI (lint, typecheck, unit, e2e, Lighthouse) pasó.
- Permisos mínimos: `permissions: {}` a nivel de workflow; en el job: `contents: read`, `pages: write`, `id-token: write`. Todas las acciones **fijadas por SHA de commit** (con comentario de la versión) y actualizadas por Dependabot. Sin secretos (modo demo).
- Variables: `SITE_ENV=preview`, `SITE_URL=https://arturo969.github.io`, `BASE_PATH=/confluye_aidev/` (repo `Arturo969/confluye_aidev`, 2026-10-28), `PUBLIC_FORM_ADAPTER=demo`. `astro.config.mjs` lee `site`/`base` de `process.env` (los `.env` no se cargan en el config de Astro); enlaces y assets vía `import.meta.env.BASE_URL` y `astro:i18n`.
- Preview no indexable: `SITE_ENV=preview` añade `<meta name="robots" content="noindex, nofollow">` y `robots.txt` con `Disallow: /`.
- **Seguridad en preview (desviación aceptada, RNF-06)**: CSP vía `<meta http-equiv>` generada por Astro (`security.csp`, hashes de scripts/estilos; `default-src 'self'`, `connect-src 'self'`, `form-action 'self'`, `base-uri 'self'`, `object-src 'none'`). Limitaciones: sin `frame-ancestors` (no válido en `<meta>`) → clickjacking no mitigado; sin HSTS propio (github.io está en la lista de precarga HSTS, pero no controlable); sin `Permissions-Policy`, `X-Content-Type-Options` ni `Referrer-Policy` por cabecera (Referrer-Policy sí vía `<meta name="referrer">`); caché de GitHub (`max-age=600`) no configurable. Aceptable porque no se transmiten datos personales (adaptador demo).

**Producción — Vercel o Netlify (pendiente)**
- Preparados en el repo: `public/_headers` (Netlify; se copia a `dist/`) y `vercel.json` (Vercel, `headers`), con: HSTS `max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`, `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` (complementa la CSP `<meta>` con hashes; ambas se aplican por intersección) y `Cache-Control: public, max-age=31536000, immutable` en `/_astro/*`; HTML con revalidación.
- Un test (vitest) verifica que ambos archivos declaran el mismo conjunto de cabeceras.
- Build de producción con `SITE_ENV=production` → activa la guardia de ADR-0003 (adaptador real, endpoint https, captcha, sin placeholders legales ni redes demo).
- **Criterios para elegir** (decide el cliente): (1) plan y uso comercial (Vercel Hobby es solo no comercial → Pro de pago; Netlify permite uso comercial en su plan gratuito — verificar planes vigentes); (2) proveedor de formulario elegido (Netlify Forms exige Netlify); (3) DPA, ubicación de datos y logs de acceso (Ley 29733, transferencia internacional); (4) dominio propio y TLS gestionado; (5) analítica sin cookies disponible; (6) facilidad de deploy previews por PR.

## Consecuencias
- (+) Preview inmediata y gratuita sin elegir proveedor; producción portable (solo cambian variables y el archivo de cabeceras aplicable).
- (−) La preview no refleja las cabeceras de producción: Mozilla Observatory ≥ A solo se puede verificar tras elegir hosting; se añade un test de cabeceras post-deploy en producción.
- (−) Dos archivos de cabeceras que mantener sincronizados (mitigado con test).
- Cambiar de hosting tras el lanzamiento = nuevo ADR que reemplaza la parte de producción.
