# ADR-0002: Sitio estático con Astro (SSG) + TypeScript estricto + CSS propio

- Estado: Aceptado 2026-10-28 · Fecha: 2026-10-27

## Contexto
- Landing de una página + política de privacidad, bilingüe es (`/`) / en (`/en/`), sin backend ni BD (PRD §1, RN-01).
- Atributos que mandan: **rendimiento móvil** (LCP < 2,5 s, JS propio ≤ 30 KB gz, CSS ≤ 30 KB gz; RNF-02/14), **accesibilidad** (WCAG 2.2 AA; RNF-04) y **seguridad/privacidad** (CSP estricta sin `unsafe-inline`, datos personales Ley 29733; RNF-06/11).
- Restricciones duras: salida 100 % estática portable (GitHub Pages con `base` de subruta → Vercel/Netlify sin cambios de código; RNF-10); paridad de claves es/en que rompe el build (RF-12); funciona sin JS (RNF-05); stack de facetas: astro/typescript/css.

## Opciones consideradas
1. **Astro SSG** (salida `static`, i18n routing nativo, `astro:assets` para imágenes, `astro:env` tipado, `security.csp` con hashes en `<meta>`). 0 KB de JS por defecto; scripts de cliente empaquetados por Vite.
2. **Next.js (`output: 'export'`)**: React en cliente (~45 KB gz de runtime solo), hidratación completa; muchas funciones (ISR, middleware, imágenes optimizadas) no aplican en export estático. Sobredimensionado y rompe el presupuesto de JS.
3. **HTML/CSS/JS a mano**: cero dependencias, pero sin plantillas: duplicación de layout es/en, sin optimización de imágenes, sin hashing de assets ni tipado del contenido; paridad i18n y CSP por hash manuales. Mantenibilidad baja (RNF-09).
4. **11ty**: SSG ligero y maduro, 0 JS por defecto; pero i18n, pipeline de imágenes, bundling de TS y CSP por hash requieren plugins/config propios; TypeScript no es de primera clase. Viable, más trabajo de integración.

## Decisión
**Opción 1: Astro SSG** — la más simple que cumple todos los RNF con primitivas nativas.
- **Versión: Astro 7.4.x** (última estable en npm a 2026-10-27: 7.4.2; fijada exacta en `package.json` + lockfile al crear el proyecto). Verificado con context7 (`/withastro/docs`) que `security.csp` (meta con hashes, `directives`, `scriptDirective`/`styleDirective`) e i18n routing con `prefixDefaultLocale: false` siguen vigentes. **Node 24 LTS** (Astro 7 exige ≥ 22.23.4; `withastro/action@v6` usa 24 por defecto) en `.nvmrc` y `engines`. Gestor: **npm** (lockfile `package-lock.json`, `npm ci`).
- `output: 'static'`, `build.format: 'directory'`, `trailingSlash: 'always'`; `site`/`base` desde variables de entorno (ver ADR-0004).
- **TypeScript estricto** (`astro/tsconfigs/strictest`), `astro check` en CI.
- **CSS propio**: `src/styles/tokens.css` (custom properties: color, tipografía fluida con `clamp()`, espaciado, radios, sombras, z-index), `reset.css`, `global.css` y estilos con ámbito en componentes `.astro`. Mobile-first, solo `min-width`. Sin Tailwind/Bootstrap.
- **JS de cliente mínimo**: módulos TS vanilla (`<script>` de Astro, empaquetados y con hash CSP) solo para formulario, menú móvil y analítica opcional. **Sin framework de islands** (React/Preact/Svelte): no hay interactividad que lo justifique; reabrir con nuevo ADR si aparece.
- **i18n**: `i18n: { defaultLocale: 'es', locales: ['es','en'], routing: { prefixDefaultLocale: false } }`; URLs con `getRelativeLocaleUrl` de `astro:i18n` (respeta `base`). Rutas de política por idioma (`/privacidad/`, `/en/privacy/`) mapeadas en `src/lib/i18n/routes.ts` para el selector de idioma y `hreflang`.
- **Contenido por idioma en archivos**: textos de UI y secciones en `src/content/{es,en}/*.json` validados con esquemas **zod** (de `astro/zod`) en build; la política de privacidad en Markdown como content collection (`src/content/{es,en}/privacy.md`, frontmatter con `version`, `updated`). Un test de vitest compara el árbol de claves es/en y falla ante cualquier diferencia; el tipo `Content` se infiere del esquema, así una clave ausente también rompe `astro check`.
- Imágenes con `<Picture>` de `astro:assets` (AVIF/WebP + fallback, `width/height`); fuentes autoalojadas (≤ 2 familias); `@astrojs/sitemap` con i18n.
- CSP: `security.csp` de Astro emite `<meta http-equiv="content-security-policy">` con hashes de scripts/estilos → sirve igual en GitHub Pages y en producción; las directivas no expresables en `<meta>` (`frame-ancestors`) van en cabeceras de producción (ADR-0004). Implica no usar `<ClientRouter />` (incompatible con la CSP de Astro).

## Consecuencias
- (+) 0 KB de runtime de framework; presupuesto de JS holgado; HTML completo sin JS; despliegue en cualquier CDN estático.
- (+) Contenido tipado y paridad i18n verificable en CI; un solo layout para ambos idiomas.
- (−) Dependencia de la cadencia de versiones mayores de Astro (migraciones); scripts vanilla exigen disciplina (tests unitarios de la lógica separada del DOM).
- (−) Sin view transitions del `ClientRouter`; no se necesita en una landing.
- Riesgo: CSP por hash solo cubre lo que Astro procesa; scripts `is:inline` o de terceros (captcha, analítica) requieren `scriptDirective.resources` explícitos y documentados.

## Revisión externa
No realizada (Gemini/DeepSeek no configurados); compensada con revisión del agente security-auditor sobre este ADR, ADR-0003 y ADR-0004.
