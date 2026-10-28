# STATE — confluye
Track: critical · Fase actual: 3-plan ✅ → 4-build · Actualizado: 2026-10-28

## Siguiente paso
- `/aidev:build T-001` — proyecto Astro 7.4.2 + TS strictest + i18n es/en mínimo + vitest/Playwright (ver docs/04-plan/backlog.md y orden TDD en docs/05-quality/test-strategy.md). Luego T-002..T-005; T-004 requiere que el usuario cree el repo remoto y autorice el push.

## Hecho recientemente
- 2026-10-28 Gate 3 aprobado: backlog de 26 tareas en 6 hitos (M0 esqueleto → M5 producción bloqueada), trazado a todos los RF Must/RNF/SR; test-strategy (vitest ≥ 90 % src/lib, msw contrato, Playwright 3×3 + axe, LHCI). EN = borrador `draft` (visible en preview, bloquea producción).
- 2026-10-28 Gate 2 aprobado: ADR-0002..0004 aceptados (Astro 7.4.2 verificado en npm/context7, Node 24, npm), overview C4, data-model, api, threat-model (20 amenazas, SR-01..17), ux-a11y (tokens con contraste AA verificado por script; Fraunces + Source Sans 3). WhatsApp retirado; formulario en modo demo; preview en GitHub Pages.
- 2026-10-27 Gate 1 aprobado: PRD (20 RF, 16 Must), nfr (21 RNF), compliance (Ley 29733 + D.S. 016-2024-JUS). Material del cliente en docs/research/. DeepSeek no configurado → sin crítica externa.
- 2026-10-27 Visión redactada en docs/00-vision.md; git init (main, sin remoto).
- 2026-10-27 Proyecto inicializado (facetas: interfaz=web, despliegue=cloud, datos=sin-estado, arquitectura=script, ia=ninguna, integracion=apis-terceros, restricciones=, regulacion=datos-personales, stack=astro/typescript/css; perfiles: web-frontend, integrations).

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
