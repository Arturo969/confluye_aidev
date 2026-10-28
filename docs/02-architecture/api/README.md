# Contratos de interfaz — confluye

No hay API propia. Fronteras: (1) envío del formulario al **proveedor externo** (futuro) y (2) **puerto `FormSubmitter`** interno con su adaptador `demo`. Esquema del payload: [`data-model.md`](../data-model.md) (`ContactPayload` v1; fuente en `src/lib/form/schema.ts`). Versionado: `schemaVersion` entero; cambio incompatible = +1. Decisión: [ADR-0003](../adr/0003-adaptador-envio-formulario.md).

## 1. Puerto `FormSubmitter`
`submit(payload: ContactPayload, { signal }) → Promise<SubmitResult>`; nunca lanza. `submitWithTimeout` aborta a los **10 s** → `timeout`.

| `SubmitResult.kind` | Significado | UI (RF-10) |
|---------------------|-------------|------------|
| `ok` | Aceptado por el proveedor (o honeypot relleno) | Confirmación en `aria-live`, limpia formulario, foco al mensaje |
| `validation` | Rechazo por datos (`fieldErrors`) o captcha (`reason: 'captcha'`) | Errores por campo / mensaje de captcha + fallback; datos conservados |
| `rate_limited` | 429 del proveedor o límite local (3 envíos/60 s) | "Inténtalo más tarde" + fallback |
| `network` | `fetch` rechazado (offline, DNS, CORS, CSP) | Error + mailto; datos conservados |
| `timeout` | Sin respuesta en 10 s | Error + mailto; datos conservados |
| `server` | 5xx, 3xx inesperado, 2xx con cuerpo de fallo, cuerpo no parseable | Error + mailto; datos conservados |

## 2. Envío al proveedor real (pendiente de elección)
- Transporte: `fetch` **POST** solo a `https://` (`PUBLIC_FORM_ENDPOINT`), `credentials: 'omit'`, `referrerPolicy: 'strict-origin-when-cross-origin'`, `redirect: 'error'`, `signal`. Nunca GET ni datos en la URL.
- Cuerpo: `application/json` (Formspree, Web3Forms) con `Accept: application/json`; `application/x-www-form-urlencoded` (Netlify Forms). En urlencoded el consentimiento se aplana: `consent_given`, `consent_policy_version`, `consent_timestamp`, `consent_locale`.
- Campos añadidos por el adaptador: token de captcha (`cf-turnstile-response` / `h-captcha-response`), clave pública (`access_key` en Web3Forms), `form-name` (Netlify), `subject` fijo sin PII (p. ej. "Nuevo contacto web CONFLUYE"). Honeypot mapeado a `_gotcha` / `botcheck` / `netlify-honeypot` según proveedor.
- CSP de producción: `connect-src` = origen del endpoint (+ captcha); nada más.

Mapeo de respuestas (genérico; los detalles de cada proveedor se verifican con su documentación oficial al elegirlo y se fijan con tests de contrato):

| Respuesta | Resultado |
|-----------|-----------|
| 2xx y cuerpo de éxito (`ok:true` Formspree, `success:true` Web3Forms, 200 Netlify) | `ok` |
| 2xx con `success:false` | `validation` si indica campo/captcha; si no, `server` |
| 400 / 422 con errores de campo | `validation` (`fieldErrors` mapeados a códigos propios; sin eco de valores) |
| 400/403 por captcha inválido | `validation`, `reason: 'captcha'` |
| 429 | `rate_limited` (`retryAfterSec` de `Retry-After` si existe) |
| 5xx, otros 3xx/4xx | `server` (`status`) |
| `TypeError` de `fetch` / `navigator.onLine === false` | `network` |
| `AbortError` por timeout | `timeout` |

Tests de contrato (vitest, `fetch` simulado): un caso por fila + verificación del cuerpo enviado (campos permitidos, `organization` ausente si `type=person`, sin honeypot).

## 3. Adaptador `demo`
- Sin peticiones de red; nunca incluido en builds `SITE_ENV=production` (la guardia busca su marcador en `dist/` y falla).
- Por defecto: resuelve `ok` tras ~800 ms (permite ver el estado "Enviando…").
- Forzar resultados (solo con adaptador `demo`, es decir, dev y preview) mediante query param de la página, sin datos personales:

| `?demo-outcome=` | Comportamiento |
|------------------|----------------|
| *(ausente)* / `ok` | `ok` |
| `validation` | `validation` con `fieldErrors: { email: 'invalid' }` |
| `captcha` | `validation`, `reason: 'captcha'` |
| `rate_limited` | `rate_limited`, `retryAfterSec: 60` |
| `network` | `network` |
| `server` | `server`, `status: 500` |
| `timeout` | no resuelve hasta que `signal` aborta → `timeout` (en Playwright, `page.clock` avanza 10 s) |

- `?demo-delay=<ms>` (0–5000) ajusta la latencia simulada. Valores desconocidos se ignoran (→ `ok`).
- El aviso "Formulario de prueba: tus datos no se envían ni se guardan" se muestra siempre con este adaptador.
- Los e2e verifican además que, con `demo`, no se emite ninguna request con datos del formulario (`page.on('request')`).
