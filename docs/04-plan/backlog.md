# Backlog — confluye

Cortes verticales pequeños (≤ 1 día). Cada tarea trazable a RF/RNF/SR/ADR. Orden: esqueleto caminante → riesgos técnicos → valor Must → verificación de RNF → Should → producción.
Estimación: S ≤ 2 h · M ≤ 1 día · L se divide.

## M0 — Esqueleto caminante
| ID | Tarea | Traza | Est. | Riesgo | Terminado cuando | Estado |
|----|-------|-------|------|--------|------------------|--------|
| T-001 | Proyecto Astro 7.4.2 + TS strictest + npm + Node 24 (`.nvmrc`, `engines`); `site`/`base` desde env; i18n es/en con página mínima en `/` y `/en/`; vitest + Playwright con 1 test cada uno | ADR-0002, RNF-09, RNF-10 | M | medio | `npm ci && npm run build` OK con y sin `BASE_PATH`; `/` tiene `lang="es"` y `/en/` `lang="en"` (test e2e); `npm test` y `npm run e2e` verdes | hecho 2026-10-28 |
| T-002 | Toolchain de calidad: eslint (+ `no-unsanitized`), prettier, stylelint (prohíbe `max-width` en media queries), `astro check`; scripts npm de CLAUDE.md | RNF-09, SR-03 | S | bajo | `npm run lint` y `npm run typecheck` limpios; un `innerHTML` de prueba y un `@media (max-width)` hacen fallar el lint | hecho 2026-10-28 |
| T-003 | CI GitHub Actions: lint, typecheck, test, build, e2e smoke; actions por SHA, `permissions: contents: read`, `npm audit --audit-level=high`, gitleaks, actionlint/zizmor; Dependabot (npm + github-actions) | RNF-07, RNF-21, SR-06, SR-07, SR-08 | M | medio | workflow válido con actionlint/zizmor sin hallazgos; todas las `uses:` con SHA completo; job falla ante vulnerabilidad alta, secreto o licencia no permitida (`license-checker`) | hecho 2026-10-28 (CI verde en PR #4) |
| T-004 | Deploy preview a GitHub Pages (`withastro/action@v6` + `actions/deploy-pages@v5`; elevación de permisos solo en job deploy; environment `github-pages`); `noindex` + banner de preview. **Requiere crear repo remoto y push: confirmación explícita del usuario** | ADR-0004, SR-05, SR-07 | S | medio | URL de Pages sirve `/` y `/en/` con assets bajo `base`; `<meta name="robots" content="noindex">` presente; banner visible | hecho 2026-10-28 (verificado en https://arturo969.github.io/confluye_aidev/) |

## M1 — Riesgos técnicos
| ID | Tarea | Traza | Est. | Riesgo | Terminado cuando | Estado |
|----|-------|-------|------|--------|------------------|--------|
| T-005 | Núcleo del formulario (TDD, sin UI): validación TS pura, `FormSubmitter`, `submitWithTimeout` 10 s, adaptador `demo` (éxito/error/timeout forzables), fábrica por `PUBLIC_FORM_ADAPTER`, guardia de build de producción | ADR-0003, RF-08, RF-10, SR-12 | M | alto | unit tests de todos los casos límite de RF-08 y de cada resultado tipado; cobertura ≥ 90 % en `src/lib/form`; build con `SITE_ENV=production` + `demo` falla | hecho 2026-10-28 (cobertura 99 % stmts / 97 % ramas) |
| T-006 | Modelo de contenido i18n: esquemas zod, JSON es/en con todo el copy del cliente (sin "Mi propuesta…"); inglés = borrador `draft: true` que bloquea build de producción hasta revisión | RF-12, RNF-09, RN-07 | M | medio | test de paridad de claves es/en; build falla si falta una clave o si `draft` en producción; copy es idéntico al de `docs/research/contenido-cliente.md` | hecho 2026-10-28 |
| T-007 | CSP con `security.csp` (sin `unsafe-inline`); `public/_headers` + `vercel.json` sincronizados por test; ningún script inline sin hash | RNF-06, SR-16, SR-17 | S | medio | test sobre `dist/` encuentra meta CSP sin `unsafe-inline`/`unsafe-eval`; test de igualdad de cabeceras entre ambos archivos | pendiente |
| T-008 | Sistema de diseño + layout: `tokens.css`, fuentes autoalojadas, cabecera fija, menú móvil accesible (`aria-expanded`, Escape, foco), skip link, formas orgánicas SVG | RF-07, RF-13, RNF-17, RNF-18, RNF-21, ux-a11y | M | medio | fuentes ≤ 80 KB medidas en `dist/` (si no, quitar itálica); e2e de menú con teclado en 360 px; axe 0 violaciones en layout vacío | pendiente |

## M2 — Valor Must
| ID | Tarea | Traza | Est. | Riesgo | Terminado cuando | Estado |
|----|-------|-------|------|--------|------------------|--------|
| T-009 | Hero (tagline + CTA a contacto, foco al h2) + concepto/descripción/propósito | RF-01, RF-02 | S | bajo | criterios G/W/T de RF-01/02 en e2e; hero cabe en 360×640 sin scroll horizontal | pendiente |
| T-010 | Propuesta de valor (6 dimensiones) + modalidades (8) en tarjetas | RF-03, RF-05 | M | bajo | 6 y 8 elementos renderizados en es/en; layout 1/2/3-4 columnas por breakpoint | pendiente |
| T-011 | Públicos (5, `<details>` abiertos sin JS) + enfoque diferencial (preguntas destacadas) + impacto (5 niveles `<ol>`) | RF-04, RF-06 | M | bajo | criterios de RF-04/06 en e2e; acordeones operables con teclado | pendiente |
| T-012 | Formulario UI: campos, labels, autocomplete, errores por campo + resumen con foco, contador 500, aviso de datos sensibles, honeypot, consentimiento no premarcado | RF-08, RF-09, RF-11, RNF-04 | M | medio | e2e de envío vacío → resumen con foco y `aria-invalid`; organización condicional; axe 0 violaciones | pendiente |
| T-013 | Estados de envío con T-005: enviando/éxito/error/timeout, aviso modo demo, fallback mailto, `<noscript>`, sin PII en storage/URL/consola | RF-10, SR-11, RNF-05, RNF-08, RNF-11 | M | medio | e2e: demo éxito + aviso; error y timeout → fallback sin perder datos; doble clic = 1 envío; storage/cookies vacíos | pendiente |
| T-014 | Política de privacidad es/en (colección `legal`) con guardia de placeholders en producción | RF-11, RNF-11, compliance | S | bajo | `/privacidad/` y `/en/privacy/` existen; build de producción falla con `[RUC]`/`TODO` | pendiente |
| T-015 | Selector de idioma (conserva hash), hreflang/canonical, sitemap, meta/OG, JSON-LD Organization | RF-12, RNF-13, SR-05 | M | bajo | e2e del selector con hash; hreflang es/en/x-default en ambas páginas; sitemap con ambas URLs | pendiente |
| T-016 | Footer legal + redes en modo demo (ocultas en producción) | RF-15, RF-16 | S | bajo | build preview muestra redes demo; build producción no las renderiza | pendiente |
| T-017 | Logo: recorte circular AVIF/WebP responsive + favicon | RNF-19, ux-a11y | S | bajo | `<picture>` con `srcset`, `width/height`, `alt`; favicon presente | pendiente |

## M3 — Verificación de RNF
| ID | Tarea | Traza | Est. | Riesgo | Terminado cuando | Estado |
|----|-------|-------|------|--------|------------------|--------|
| T-018 | E2E multi-viewport (360/768/1440 × Chromium/WebKit/Firefox): sin scroll horizontal 320–1920, objetivos ≥ 44 px, axe 0 violaciones, teclado | RNF-01, RF-13, RNF-04, RNF-15, RNF-17, RNF-18, RNF-19 | M | medio | matriz completa verde en CI (nightly/main); matriz RF Must → test sin huecos | pendiente |
| T-019 | Lighthouse CI con presupuestos (≥ 90 × 4 en móvil, LCP < 2,5 s, CLS < 0,1, JS ≤ 30 KB gz, página ≤ 500 KB) | RNF-02, RNF-14 | S | medio | `npm run lhci` pasa con presupuestos en CI | pendiente |
| T-020 | Tests de seguridad: payloads XSS en campos/hash/query, sin cookies, sin PII fuera del POST | SR-03, SR-11, SR-17, RNF-08 | S | bajo | suite de seguridad e2e verde; ningún payload se ejecuta | pendiente |

## M4 — Should
| ID | Tarea | Traza | Est. | Riesgo | Terminado cuando | Estado |
|----|-------|-------|------|--------|------------------|--------|
| T-021 | Analítica sin cookies (tras elegir proveedor) | RF-17, SR-17 | S | bajo | criterios de RF-17; test sin cookies/storage; mencionada en la política | pendiente |

## M5 — Producción (bloqueado por datos/decisiones del cliente)
| ID | Tarea | Traza | Est. | Riesgo | Terminado cuando | Estado |
|----|-------|-------|------|--------|------------------|--------|
| T-030 | Elegir hosting de producción y proveedor de formulario + captcha accesible (DPA, país, uso comercial) | SR-13, RNF-20, ADR-0004 | S | alto | ADR nuevo aceptado; registro de encargados actualizado en compliance | bloqueado |
| T-031 | Adaptador real + captcha + email en texto plano + alerta de cuota | SR-01, SR-02, SR-04, RNF-16 | M | alto | tests de contrato verdes; envío real recibido en staging | bloqueado |
| T-032 | Cabeceras de producción + smoke post-deploy (cabeceras, sin demo, envío canario) | RNF-03, RNF-06, SR-12, SR-16 | S | medio | Observatory ≥ A; smoke post-deploy verde | bloqueado |
| T-033 | Cuentas y operación: 2FA, `main` protegida, bandeja/email dedicados, DNS/CAA, plan de incidentes | SR-09, SR-10, SR-14, SR-15, RNF-12 | M | alto | checklist de threat-model "antes de producción" completo; runbook actualizado | bloqueado |
| T-034 | Datos legales finales en la política + inscripción ANPD + revisión de la traducción EN | RF-11, compliance, RN-07 | S | alto | política sin placeholders; `draft: false` en EN tras revisión del cliente | bloqueado |

RF-18/RF-19 (Could): sin tareas hasta que haya contenido autorizado.

**Definición de terminado (DoD)**: tests pasan (incluido el nuevo), lint/tipos limpios, sin hallazgos de seguridad altos, criterio "Terminado cuando" cumplido, docs y STATE.md actualizados, commit pequeño (Conventional Commits), revisado.

## Riesgos del plan
- Astro 7 es reciente: posibles cambios respecto a la doc indexada → consultar context7/doc oficial en cada API (ADR-0002).
- Presupuesto de fuentes (~94 KB estimados vs 80 KB) → medir en T-008.
- T-004 depende de que el usuario cree el repo y autorice el push.
- Hito M5 bloqueado por datos legales, dominio y elección de proveedores del cliente.
