# ADR-0003: Puerto/adaptador de envío del formulario seleccionado en build

- Estado: Aceptado 2026-10-28 · Fecha: 2026-10-27 · Núcleo implementado en T-005 (`src/lib/form/*`, `src/lib/config/deploy-guard.ts`, `src/integrations/build-guard.ts`); el marcador demo vive en `src/lib/form/markers.ts` para que la guardia no importe el adaptador

## Contexto
- Sin backend propio: el envío se delega a un proveedor externo aún no elegido (candidatos: Netlify Forms, Formspree, Web3Forms, con captcha Turnstile/hCaptcha). Ahora el formulario funciona en **modo demo** (preview en GitHub Pages): no sale ningún dato a la red (RF-10).
- Requisitos: timeout 10 s y error con fallback email en ≤ 1 s (RNF-05); cambiar de proveedor = cambiar adaptador + config (RNF-16, RNF-10); sin PII en consola/storage/URL (RF-10, RNF-08); honeypot + captcha (RF-09); un build de producción con `demo` o sin endpoint **debe fallar** (RF-10).

## Opciones consideradas
1. **Puerto `FormSubmitter` + adaptadores, elegido en build por variable pública** (`PUBLIC_FORM_ADAPTER`). El bundle solo contiene el adaptador elegido (sustitución estática + eliminación de código muerto).
2. **POST HTML nativo al endpoint del proveedor** (`<form action=...>`): funciona sin JS, pero navega fuera del sitio, sin estados accesibles, sin timeout ni modo demo, y acopla el marcado al proveedor.
3. **Llamada directa al proveedor dentro del componente** (`fetch` inline): más corto hoy; cambiar de proveedor o testear requiere tocar UI; no hay punto único para la guardia de producción.

## Decisión
**Opción 1.** Elementos:

- **Puerto** (`src/lib/form/submitter.ts`):
  ```ts
  type SubmitResult =
    | { kind: 'ok' }
    | { kind: 'validation'; fieldErrors: Partial<Record<FieldName, ErrorCode>>; reason?: 'captcha' }
    | { kind: 'rate_limited'; retryAfterSec?: number }
    | { kind: 'network' } | { kind: 'timeout' } | { kind: 'server'; status?: number };
  interface FormSubmitter {
    readonly id: 'demo' | 'formspree' | 'web3forms' | 'netlify';
    submit(payload: ContactPayload, opts: { signal: AbortSignal }): Promise<SubmitResult>;
  }
  ```
  Los adaptadores **nunca lanzan**: todo fallo se mapea a un `SubmitResult` (tabla en `api/README.md`).
- **Timeout**: `submitWithTimeout(submitter, payload, 10_000)` crea un `AbortController`, aborta a los 10 s y devuelve `timeout` (distinto de `network`). Constante única `FORM_TIMEOUT_MS`.
- **Adaptadores**: `demo` (simula éxito/errores/timeout sin red; contrato en `api/README.md`) y **uno real pendiente** de la elección del cliente (Formspree o Web3Forms vía `fetch` JSON; Netlify Forms vía urlencoded, solo si el hosting es Netlify). Cada adaptador traduce el `ContactPayload` canónico a los nombres del proveedor.
- **Selección**: fábrica `createSubmitter(config)` (`src/lib/form/factory.ts`), único módulo que importa adaptadores. Config desde `astro:env`: `PUBLIC_FORM_ADAPTER` (enum), `PUBLIC_FORM_ENDPOINT` (URL https, opcional en demo), `PUBLIC_FORM_ACCESS_KEY` (clave **pública** del proveedor si aplica), `PUBLIC_CAPTCHA_PROVIDER` (`none|turnstile|hcaptcha`), `PUBLIC_CAPTCHA_SITE_KEY`. Nunca secretos en cliente.
- **Validación compartida**: `validateContact(input, locale)` en `src/lib/form/schema.ts`, TS puro sin dependencias (constantes de límites y enum de servicios exportadas), usada por el script del formulario y por los tests. Se descarta zod en cliente para no consumir el presupuesto de 30 KB gz; zod se usa solo en build (contenido, env). La validación de servidor es la del proveedor (reglas/allow-list de campos); la de cliente **no es control de seguridad**.
- **Construcción del payload** (`payload.ts`): `trim`, omite `organization` si `type=person`, añade `consent` (`given`, `policyVersion` desde el frontmatter de la política, `timestamp` ISO-8601 UTC, `locale`) y `schemaVersion`.
- **Honeypot**: campo `company_url` oculto (`aria-hidden`, `tabindex=-1`, `autocomplete=off`); si viene relleno, el controlador devuelve `ok` sin red. El adaptador real además lo mapea al campo honeypot del proveedor (`_gotcha`, `botcheck`, `netlify-honeypot`).
- **Antiabuso en cliente**: botón deshabilitado y `aria-busy` durante el envío (una sola solicitud por doble clic); máx. 3 envíos/60 s por carga de página (contador en memoria, no storage) → `rate_limited` local. El rate limit real es del proveedor.
- **Privacidad**: sin `console.*` (regla ESLint `no-console: error`), sin `localStorage/sessionStorage/cookies`, método POST/fetch (nunca GET con datos), errores sin eco de valores. El `<form>` no tiene `action` y usa `method="post"`.
- **Mejora progresiva**: el `<form>` se sirve con `hidden` y el script lo muestra al inicializar; `<noscript>` muestra el bloque de contacto por email (mailto). Así sin JS no hay formulario roto ni envío accidental.
- **Modo demo visible**: con `demo` se muestra el aviso accesible "Formulario de prueba: tus datos no se envían ni se guardan".
- **Guardia de build**: función pura `assertDeployConfig(env)` (testeada en vitest) ejecutada por una integración Astro en `astro:config:setup`. Si `SITE_ENV=production` y (`PUBLIC_FORM_ADAPTER=demo` o falta/no es https `PUBLIC_FORM_ENDPOINT` o captcha `none`) → `throw` y el build falla. En `astro:build:done` se busca en `dist/` el marcador del adaptador demo, enlaces de redes demo y placeholders legales (`TODO|\[[^\]]+\]` en política/footer; RF-11/15/16) → falla.

## Consecuencias
- (+) Cambiar de proveedor toca 1 adaptador + variables; tests de contrato por adaptador con `fetch` simulado (2xx/4xx/429/5xx/red/timeout).
- (+) Preview segura: sin transmisión de datos personales; producción imposible en demo.
- (−) Sin JS no se puede usar el formulario (solo email); aceptado por RF-10.
- (−) Netlify Forms acopla proveedor y hosting (formulario debe detectarse en el HTML estático con `data-netlify`); si se elige, el adaptador y el marcado lo reflejan.
- Riesgo: el captcha añade script de tercero (CSP, privacidad, a11y); se decide con el proveedor real en un ADR posterior.
