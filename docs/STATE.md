# STATE — confluye
Track: critical · Fase actual: 4-build (M0) · Actualizado: 2026-10-28

## Siguiente paso
- Usuario: PR de `feat/T-005-form-core` → merge con CI verde. Luego `/aidev:build T-006` (contenido i18n: esquemas zod, copy es + borrador en con `draft`, paridad de claves).

## Hecho recientemente
- 2026-10-28 T-005: núcleo del formulario (schema, payload, submitter+timeout, rate limit, demo, factory, deploy-guard + integración); 94 unit (estables 5/5 tras precalentar ESLint), cobertura 99/97 %, prod+demo falla el build. T-004 verificado en la URL; ruleset de main creado por el usuario.
- 2026-10-28 T-004 (pendiente verificar URL): workflow deploy-preview (permisos solo en deploy), SITE_ENV con astro:env, noindex/robots/banner fuera de producción; 24 unit + 4 build + 5 e2e verdes (también con BASE_PATH de Pages). T-003 fusionado (PR #4, CI 6/6 verde).
- 2026-10-28 T-003: remoto `Arturo969/confluye_aidev` (main = T-002 subido); CI de 6 jobs con acciones por SHA, Dependabot con cooldown, script de licencias propio; actionlint y zizmor sin hallazgos en local.
- 2026-10-28 T-002 hecho: ESLint 10 + Prettier + Stylelint; 10 tests prueban que XSS (innerHTML/document.write), console, import de adaptadores, ciclos y max-width fallan. Pendiente: npm bloqueó el postinstall de `unrs-resolver` (no hace falta: no-cycle verificado).
- 2026-10-28 T-001 hecho: Astro 7.4.2, i18n es/en, `site`/`base` por env; tests unit (100 % cobertura routes), build con/sin BASE_PATH y e2e `lang` verdes (también con base). Commit base de docs en main.

## Gates
| Fase | Estado |
|------|--------|
| 0 start | ✅ |
| 1 req | ✅ |
| 2 design | ✅ |
| 3 plan | ✅ |
| 4 build | ⏳ |
| 5 verify | ⏳ |
| 6 release | ⏳ |

## Bloqueos / decisiones pendientes
- Bloquean producción (no la preview de GitHub Pages con formulario demo): titular del banco de datos (Confluye sin RUC aún), inscripción ANPD, dominio, email público definitivo (provisional jesusarturo965@gmail.com). WhatsApp retirado por el cliente.
- Abiertas: revisión de la traducción EN (Claude redacta borrador; cliente revisa antes de producción), formato de teléfono, modo oscuro (UX propone no tenerlo en MVP), redes (demo por ahora), logo SVG/PNG transparente, equipo/testimonios, menores, plazo de respuesta, proveedor de analítica. Ver PRD §8.

## Notas para la próxima sesión
- Track critical solo por el formulario con datos personales (Perú, Ley 29733): threat model y privacidad proporcionados a un sitio estático.
- Decidido: preview GitHub Pages con formulario demo. Pendiente para producción: hosting (Vercel Hobby no permite uso comercial) y proveedor de formulario + captcha accesible (DPA, país).
- Fuentes ~94 KB estimadas vs presupuesto 80 KB: medir en build; si excede, quitar Fraunces itálica.
