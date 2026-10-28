# Estrategia de pruebas — confluye

Sitio estático Astro 7.4.x + TypeScript strictest, Node 24, npm. Sin BD ni backend: la lógica testeable vive en `src/lib` (puro) y `src/scripts` (DOM); la única frontera externa es el puerto `FormSubmitter` ([ADR-0003](../02-architecture/adr/0003-adaptador-envio-formulario.md), [api/README](../02-architecture/api/README.md)). Pirámide: muchas unitarias de `src/lib`, contrato por adaptador, pocos E2E críticos sobre el build real, y verificaciones no funcionales sobre `dist/`.

| Nivel | Herramienta | Alcance | Umbral |
|-------|-------------|---------|--------|
| Unitarias | Vitest (entorno `node`; `happy-dom` solo en tests de `src/scripts`) + cobertura v8 | `src/lib/**` (form, i18n, config) | cobertura ≥ 90 % líneas y ramas en `src/lib` (build falla); RNF-09 exige ≥ 80 % como mínimo global |
| Integración | Vitest + `happy-dom` | `scripts/contact-form.ts` y `nav.ts` contra el DOM del componente con adaptador `demo` (no hay BD/colas/APIs propias) | estados y foco de los flujos críticos |
| Contrato | Vitest + `msw` (o `fetch` simulado) | adaptador real vs. proveedor simulado con los payloads/respuestas de api/README | 100 % de las filas de la tabla de mapeo; preparado antes de T-031 |
| E2E | Playwright sobre `astro preview` del build (con `base`) + `@axe-core/playwright` | recorridos críticos, a11y, layout, privacidad | verdes en CI; 0 violaciones axe WCAG 2.2 AA |
| No funcionales | `@lhci/cli`, scripts sobre `dist/`, ESLint, `npm audit`, gitleaks, actionlint/zizmor | rendimiento, peso, seguridad, cabeceras | presupuestos de `nfr.md` |

## 1. Unitarias (`tests/unit/`)
Nombres describen la regla (`rechaza mensaje de 501 caracteres tras trim`). Sin red, sin reloj real, sin aleatoriedad.

- **Validación** (`schema.ts`, RF-08): campos obligatorios; `trim` previo a validar (solo espacios = vacío); mensaje 500 válido / 501 inválido (tras trim); nombre 100 válido / 101 inválido; email válido e inválidos (sin `@`, sin dominio, espacios, unicode); teléfono opcional con 7–15 dígitos (6 y 16 inválidos; acepta `+`, espacios, guiones; rechaza letras); organización obligatoria solo si `type=organization`; consentimiento obligatorio; `service` dentro de `SERVICE_IDS`; mensajes por locale es/en; los errores no ecoan valores.
- **Payload** (`payload.ts`): trim, `organization` omitida si `type=person`, `consent{given,policyVersion,timestamp ISO UTC,locale}` y `schemaVersion` (reloj inyectado), honeypot excluido.
- **Puerto** (`submitter.ts`): tipado exhaustivo de `SubmitResult` (`expectTypeOf` + switch exhaustivo); `submitWithTimeout` con `vi.useFakeTimers`: resuelve antes de 10 s, `timeout` a 10 000 ms exactos (≠ `network`), aborta la señal, no deja timers pendientes, nunca lanza.
- **Adaptador `demo`**: ok por defecto (~800 ms con timers falsos), cada `demo-outcome` (`validation`, `captcha`, `rate_limited`, `network`, `server`, `timeout`), `demo-delay` 0–5000 y valores fuera de rango/desconocidos → `ok`; cero llamadas a `fetch` (espía que falla si se invoca).
- **Fábrica y guardia**: `createSubmitter` elige por `PUBLIC_FORM_ADAPTER`; valor desconocido falla; `assertDeployConfig`: `production`+`demo` falla, sin endpoint o no-https falla, captcha `none` falla, `preview`+`demo` pasa; escaneo de `dist/` (marcador demo, redes demo, placeholders `TODO|[...]`) sobre un directorio temporal sintético.
- **i18n**: paridad de claves es/en (recursiva, también `site.json`), `draft: true` bloquea producción, rutas `routes.ts` con y sin `base` (equivalencias es↔en, hash conservado), sin placeholders.
- **Sincronía de cabeceras**: `public/_headers` y `vercel.json` expresan las mismas cabeceras (RNF-06).
- **Reglas de arquitectura**: ESLint `no-restricted-imports`/`import-x/no-cycle` (adaptadores solo vía `factory`) forman parte de `npm run lint`.

## 2. Contrato del adaptador real (`tests/unit/adapters/<proveedor>.contract.test.ts`)
Un test parametrizado por fila de api/README §2, con `msw` (`setupServer`) como proveedor simulado; el mock es del tercero, no de nuestro código.
- 2xx con cuerpo de éxito → `ok`; 2xx `success:false` → `validation` o `server`; 400/422 con errores de campo → `validation` (`fieldErrors`, sin eco de valores); captcha inválido → `validation{reason:'captcha'}`; 429 → `rate_limited` (+`Retry-After`); 5xx/3xx/4xx otros → `server{status}`; `TypeError` de fetch → `network`; abort → `timeout`; cuerpo no parseable → `server`.
- Request: método POST, solo `https://`, `credentials:'omit'`, `redirect:'error'`, `Accept: application/json`, content-type según proveedor, campos permitidos únicamente, `organization` ausente si `type=person`, honeypot mapeado, consentimiento aplanado en urlencoded, `subject` sin PII, ningún dato en la URL.
- Se escriben ahora contra el contrato (marcados `it.todo`/skip con el id de T-031) y se activan al llegar el adaptador. Cambiar de proveedor = nuevo fichero de contrato con los mismos casos (RNF-16).

## 3. E2E (`tests/e2e/`, Playwright)
Servidor: `astro preview` del build (con `BASE_PATH` en una pasada). Proyectos: `chromium`, `webkit`, `firefox` × viewports 360×800, 768×1024, 1440×900 (9 combinaciones en la matriz completa). Resultados del demo forzados con `?demo-outcome=` y `page.clock` para el timeout de 10 s; sin `waitForTimeout` arbitrarios.

Recorridos críticos:
1. Navegar por anclas y menú móvil solo con teclado (Tab/Enter/Esc, `aria-expanded`, foco devuelto, `scroll-padding` con cabecera fija).
2. Enviar formulario válido en demo → éxito en `aria-live`, aviso demo visible, formulario limpio, foco al mensaje; doble clic = 1 envío; sin request con datos (`page.on('request')`).
3. Envío inválido → resumen de errores con foco en el primer error, `aria-invalid`/`aria-describedby` por campo.
4. `network`, `server`, `rate_limited`, `captcha` y `timeout` → mensaje + fallback `mailto`, datos conservados, en ≤ 1 s tras el fallo.
5. Cambio de idioma conservando hash y ruta equivalente (con `base`).
6. JS deshabilitado (`javaScriptEnabled:false`) → contenido completo, `<noscript>` con mailto, formulario oculto.
7. Privacidad: cookies/localStorage/sessionStorage vacíos, sin PII en URL ni consola (sin errores CSP).
8. Seguridad cliente: payloads XSS en hash/query (`#<img onerror>`, `?demo-outcome=<script>`) y en campos → sin ejecución, valores desconocidos ignorados.

Transversales: `@axe-core/playwright` por página (`/`, `/en/`, política es/en, 404) y por estado (menú abierto, errores, enviado) con tags `wcag2a, wcag2aa, wcag21aa, wcag22aa` → 0 violaciones; barrido de 320 a 1920 px cada 40 px sin `scrollWidth > clientWidth`; objetivos táctiles ≥ 44×44 px y separación ≥ 8 px, sin solape de la cabecera fija con el campo enfocado; SEO del HTML generado (title/description únicos, hreflang, canonical, un h1, `lang`); zoom 400 %/reflow 320 px.

## 4. No funcionales
| Qué | Herramienta | Umbral (nfr.md) |
|-----|-------------|-----------------|
| Rendimiento/calidad | `@lhci/cli`, perfil móvil, 3 corridas, mediana, `/`, `/en/`, política | Perf/A11y/BP/SEO ≥ 90; LCP < 2,5 s; CLS < 0,1; TBT < 200 ms; peso inicial ≤ 500 KB; bloquea merge |
| Peso | script `scripts/check-budgets.mjs` sobre `dist/` | JS propio ≤ 30 KB gz; CSS ≤ 30 KB gz; fuentes ≤ 2 familias/≤ 80 KB; imagen LCP ≤ 100 KB; imágenes con `width/height` y `srcset` |
| SAST cliente | `eslint-plugin-no-unsanitized`, `no-console`, reglas Astro/jsx-a11y | 0 errores (SR-03, SR-11) |
| CSP | test sobre `dist/*.html`: existe `<meta http-equiv="Content-Security-Policy">`, sin `unsafe-inline`/`unsafe-eval`, `connect-src` acorde al entorno | RNF-06 |
| Dependencias | `npm audit --omit=dev --audit-level=high`, Dependabot, `license-checker` | 0 altas/críticas (SR-06, RNF-21) |
| Secretos/CI | gitleaks (CI y pre-commit), `actionlint`, `zizmor` | 0 hallazgos (SR-07, SR-08) |
| Reproducibilidad | doble build y comparación de hashes | idéntico salvo timestamps (RNF-10) |
| Post-deploy (producción futura) | smoke: Mozilla Observatory ≥ A y cabeceras RNF-06; envío canario con dato sintético; bundle sin aviso demo | SR-12, SR-16; mensual (RNF-12) |

## 5. Matriz de ejecución
| Disparador | Qué corre | Presupuesto de tiempo |
|------------|-----------|-----------------------|
| pre-commit (husky/lint-staged, opcional) | prettier/eslint/stylelint de ficheros staged, gitleaks, vitest `--changed` | < 30 s |
| Cada PR (rápido) | `npm ci` → lint → typecheck → unit + cobertura → build (preview y guardia producción falla esperado) → e2e chromium móvil 360×800 + axe → audit, gitleaks, actionlint/zizmor, test de cabeceras/CSP/presupuestos | ≤ 10 min |
| main y nightly | matriz completa 3 navegadores × 3 viewports, barrido de anchos, doble build, `lhci` (bloquea merge en PR a main si baja de umbrales; nightly sobre preview desplegada), license-checker | ≤ 30 min |
| Post-deploy producción | Observatory/cabeceras, smoke de bundle, envío canario, uptime | tras cada deploy; sintético mensual |

## 6. Datos, estabilidad y trazabilidad
- **Datos**: solo sintéticos (`Ana Prueba`, `ana.prueba@example.com`, `+51 999 000 000`, organización `Org de Prueba`); generados por fábricas en `tests/fixtures/`; prohibido cualquier dato real, incluidos buzones de Confluye. Reloj y aleatoriedad inyectados.
- **Flakies**: no se ignoran ni se reintentan a ciegas. Un test inestable se pone en cuarentena (`test.fixme`/tag `@quarantine` excluido de PR) con issue enlazada y dueño; plazo ≤ 7 días para arreglar o borrar. Playwright `retries: 1` solo en CI y todo reintento exitoso se reporta como flaky. Sin `sleep`; esperas por aserciones web-first y `page.clock`.
- **Reporte**: salida resumida (`--reporter=dot`/`line`); en fallo, trace de Playwright como artefacto.

Trazabilidad (RNF-01: cada Must con test):
| Requisito | Tipo de test |
|-----------|--------------|
| RF-08 validación/payload | unit (§1) + e2e recorrido 3 |
| RF-09 honeypot/captcha/antiabuso | unit (payload, controlador) + contrato + e2e 2 y 4 |
| RF-10 estados, demo, fallback, noscript | unit demo/submitter + integración DOM + e2e 2, 4, 6, 7 |
| RF-12 / RNF-09 i18n, paridad | unit i18n + e2e 5 + `draft` build |
| RF-07 / RNF-04 / RNF-18 a11y y táctil | e2e 1, 3 + axe + bounding boxes + revisión manual NVDA/VoiceOver |
| RF-13 / RNF-17 / RNF-19 mobile-first | stylelint + e2e barrido + auditoría de imágenes + 3 viewports |
| RF-11/15/16, RNF-11 placeholders legales | unit guardia + e2e cookies/storage + revisión `compliance.md` |
| RNF-02 / RNF-14 rendimiento | lhci + script de presupuestos |
| RNF-05 fiabilidad | unit timeout + e2e 4 y 6 |
| RNF-06 / SR-16 cabeceras, CSP | unit headers-sync + test CSP en HTML + post-deploy |
| RNF-07 / SR-06/07/08 suministro | audit, gitleaks, actionlint/zizmor, license-checker |
| RNF-08 / SR-11 sin PII, solo HTTPS | e2e 2 y 7 + contrato (https/POST) |
| RNF-10 portabilidad | doble build + build con y sin `BASE_PATH` + e2e con `base` |
| RNF-13 SEO | e2e SEO + lhci |
| RNF-15 compatibilidad | matriz 3 navegadores; Samsung Internet/dispositivos reales manual |
| RNF-16 contrato proveedor | §2 |
| SR-03 XSS | eslint no-unsanitized + e2e 8 |
| SR-12 guardas demo | unit guardia + build de producción + post-deploy |
| SR-01/02/04/05/09/10/13/14/15/17 | controles operativos/proveedor: checklist manual; SR-05 `noindex`/banner en e2e SEO; SR-17 e2e sin cookies |

## 7. Orden TDD sugerido
- **T-001** (andamiaje): (1) test e2e rojo `/` `lang=es` y `/en/` `lang=en` + test unit trivial de `routes`; (2) proyecto mínimo hasta verde; (3) test de build con y sin `BASE_PATH` (script CI); (4) configurar `vitest.config.ts` con umbral de cobertura y `playwright.config.ts` (1 proyecto), luego ampliar a la matriz.
- **T-005** (núcleo del formulario): (1) `schema` — obligatorios y trim → límites 500/501, 100/101 → email → teléfono 7–15 → organización condicional → consentimiento; (2) `payload`; (3) tipos de `SubmitResult` y puerto; (4) `submitWithTimeout` con timers falsos; (5) adaptador `demo` (ok, cada outcome, timeout); (6) fábrica; (7) `assertDeployConfig` y escaneo de `dist/`; (8) activar umbral ≥ 90 %. Cada paso: test rojo → mínimo código → refactor.
- **T-006** (contenido i18n): (1) test de paridad de claves es/en rojo con fixtures mínimas; (2) esquemas zod por sección y fallo de build por clave ausente; (3) `draft: true` bloquea producción (reutiliza `assertDeployConfig`); (4) test de copy idéntico a `docs/research/contenido-cliente.md` y ausencia de placeholders; (5) `routes.ts` con `base`.

- Datos de prueba: sintéticos; nunca datos personales reales.
- Tests inestables: se arreglan o se ponen en cuarentena con issue, nunca se ignoran.
