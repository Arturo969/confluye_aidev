# PRD — confluye

Estado: borrador v0.1 (fase 1). Fuente de verdad del contenido: `docs/research/contenido-cliente.md`. En el copy, "[Nombre del emprendimiento]" se sustituye por CONFLUYE.

## 1. Resumen

CONFLUYE es un emprendimiento social / consultora de bienestar humano y colectivo que opera en Perú. Tagline: "Personas que se encuentran. Bienestar que se construye."

Producto: landing de una página, estática (Astro SSG + TypeScript + CSS), bilingüe (es por defecto en `/`, en en `/en/`), mobile-first, con formulario de contacto que entrega la solicitud por email a Confluye mediante un proveedor externo (sin base de datos ni backend propios). Incluye página de política de privacidad (es/en), enlaces a redes y analítica sin cookies (Should).

Objetivos (KPIs, de `00-vision.md`): contactos válidos/mes; tasa de envío del formulario; Lighthouse ≥ 90 en 4 categorías (móvil); WCAG 2.2 AA; LCP < 2,5 s en móvil 4G.

Fuera de alcance (Won't): blog, CMS, área privada, pagos/reservas, base de datos propia.

Supuestos explícitos (a confirmar, ver sección 8): el cliente aporta email, redes, dominio y datos del titular del banco de datos; el proveedor de formularios se elige en design; la traducción al inglés la redacta Claude y la revisa el cliente.

## 2. Actores y permisos

| Actor | Objetivo | Permisos |
|-------|----------|----------|
| Visitante persona | Conocer el enfoque de CONFLUYE y solicitar acompañamiento o información | Lectura pública de todo el sitio; enviar el formulario (con consentimiento); cambiar idioma; abrir redes |
| Visitante organización (empresa, institución educativa, comunidad) | Evaluar servicios para su equipo/comunidad y solicitar contacto | Igual que el anterior; indica tipo "organización" y nombre de la organización |
| Equipo Confluye | Recibir y responder contactos; atender derechos ARCO; mantener contenido | Acceso a la bandeja de email destino y al panel del proveedor de formularios; commit/deploy del repo (sin CMS). Ninguno de los visitantes tiene cuentas ni autenticación |

## 3. Requisitos funcionales (historias)

Formato: `RF-NN` · historia · prioridad MoSCoW · criterios Given/When/Then.

### RF-01 Hero con tagline y CTA a contacto
Como visitante quiero entender de inmediato qué es CONFLUYE y cómo contactar para decidir si me interesa.
- Prioridad: Must
- Criterios:
  - Given la página `/` When carga Then el primer viewport muestra el logo, el tagline "Personas que se encuentran. Bienestar que se construye." y un botón CTA, sin necesidad de scroll en 360×640.
  - Given el CTA When el visitante lo activa (clic o Enter) Then la vista se desplaza a la sección de contacto y el foco se mueve al primer campo del formulario o al encabezado de la sección.
  - Given `/en/` When carga Then tagline y CTA aparecen en inglés.
  - Given usuario con `prefers-reduced-motion` When activa el CTA Then el desplazamiento es instantáneo (sin animación).
  - Given el logo es raster 1024×559 When se muestra Then lleva `alt` descriptivo ("CONFLUYE") y dimensiones `width/height` declaradas (sin CLS).

### RF-02 Secciones: concepto, descripción y propósito
Como visitante quiero leer el concepto, la descripción y el propósito para comprender el enfoque.
- Prioridad: Must
- Criterios:
  - Given la página When se renderiza Then existen secciones con el concepto central, la descripción del emprendimiento y el propósito, con el texto del cliente (CONFLUYE en lugar de "[Nombre del emprendimiento]"); una prueba busca que no quede ninguna cadena "[Nombre" en el HTML generado.
  - Given cualquier sección When se inspecciona Then tiene un encabezado (h2) y la jerarquía h1→h2→h3 no salta niveles.
  - Given el texto cambia en el archivo de contenido When se reconstruye Then el HTML refleja el cambio sin tocar los componentes de layout.

### RF-03 Propuesta de valor: 6 dimensiones del bienestar
- Prioridad: Must
- Criterios:
  - Given la sección When se renderiza Then muestra exactamente 6 dimensiones (personal, relacional, grupal, organizacional, comunitario, educativo), cada una con su descripción del copy.
  - Given viewport 360 px When se visualiza Then las 6 se apilan en una columna sin truncar texto; Given ≥ 1024 px Then se disponen en cuadrícula.
  - Given las dimensiones se listan When las lee un lector de pantalla Then se anuncian como lista con 6 elementos.

### RF-04 Públicos y ámbitos de intervención (5 públicos)
- Prioridad: Must
- Criterios:
  - Given la sección When se renderiza Then muestra 5 públicos: niños y adolescentes, jóvenes, adultos, organizaciones y equipos, comunidades y colectivos sociales, cada uno con sus viñetas del copy (5, 5, 5, 6 y 6 respectivamente).
  - Given un público con muchas viñetas When se muestra en 360 px Then no hay scroll horizontal ni texto cortado.
  - Given se usan acordeones/pestañas (decisión de design) When se operan con teclado Then cumplen patrón WAI-ARIA y el contenido es accesible sin JS (degradación a contenido visible).

### RF-05 Modalidades de servicio (8)
- Prioridad: Must
- Criterios:
  - Given la sección When se renderiza Then muestra las 8 modalidades (consultorías especializadas, diagnósticos de bienestar, talleres y experiencias formativas, programas de intervención, capacitación, investigación aplicada, diseño de proyectos sociales, acompañamiento a organizaciones), con su descripción.
  - Given las 8 modalidades When se consume la lista de opciones del formulario Then ambas salen de la misma fuente de datos (no se duplican manualmente) y el select tiene 8 + "No estoy seguro/a" = 9 opciones.

### RF-06 Enfoque diferencial e impacto social (5 niveles)
- Prioridad: Must
- Criterios:
  - Given la página When se renderiza Then hay una sección de enfoque diferencial con las preguntas del copy y una de impacto con 5 niveles (individual, relacional, grupal, organizacional, comunitario).
  - Given el cierre del copy ("En síntesis, ...") When se renderiza Then aparece una vez, con CONFLUYE como sujeto.

### RF-07 Navegación por anclas y menú móvil accesible
Como visitante quiero saltar a cada sección desde un menú.
- Prioridad: Must
- Criterios:
  - Given cualquier viewport When se activa un enlace del menú Then la vista llega a la sección correspondiente y la URL actualiza el hash; el encabezado fijo no tapa el título de la sección (scroll-margin).
  - Given viewport < 768 px When se carga Then el menú está colapsado tras un botón con `aria-expanded`, `aria-controls` y nombre accesible; Enter/Espacio lo abren, Esc lo cierra y devuelve el foco al botón.
  - Given menú abierto When el usuario tabula Then el foco no escapa a contenido oculto detrás y, al elegir un enlace, el menú se cierra.
  - Given JS deshabilitado When se visita Then los enlaces de navegación siguen siendo accesibles (menú visible o `<details>`).
  - Given hash inexistente (`#xyz`) When se carga Then la página se muestra desde el inicio sin error.
  - Given enlace "saltar al contenido" When se tabula primero Then es visible al recibir foco.

### RF-08 Formulario de contacto: campos y validación en cliente
Como visitante quiero enviar mis datos para ser contactado.
- Prioridad: Must
- Campos: nombre (obligatorio), email (obligatorio), teléfono (opcional), tipo (persona/organización; obligatorio), organización (obligatoria solo si tipo=organización), servicio de interés (8 modalidades + "No estoy seguro/a"), mensaje breve (opcional, máx. 500 caracteres, con contador y aviso de no compartir información de salud o emocional sensible), consentimiento (checkbox no premarcado, obligatorio).
- Criterios:
  - Given formulario vacío When se intenta enviar Then no se envía nada a la red, aparece un mensaje de error por cada campo obligatorio vacío, cada error está asociado al campo (`aria-describedby`/`aria-invalid`), hay un resumen de errores (con enlaces a cada campo) y el foco se mueve a ese resumen (decisión de design 2026-10-27, ver ux-a11y.md).
  - Given email sin formato válido (ej. "a@b") When se valida Then se muestra error "email no válido"; el input usa `type="email"` y `autocomplete="email"`.
  - Given teléfono con letras o longitud fuera de 7-15 dígitos (formato a confirmar) When se valida Then error; vacío es válido; input `type="tel"` y `autocomplete="tel"`.
  - Given tipo=persona When se muestra el formulario Then el campo organización está oculto/deshabilitado y no se envía; Given tipo=organización y organización vacía Then error de campo obligatorio.
  - Given cambio de tipo organización→persona con organización rellena When se envía Then el valor de organización no se transmite.
  - Given mensaje con 500 caracteres exactos Then se acepta; con 501 Then se bloquea/ trunca con aviso y el contador indica el exceso. Nombre > 100 caracteres → error.
  - Given nombre con solo espacios When se valida Then se considera vacío (se recorta con trim).
  - Given texto con HTML/scripts en cualquier campo When se envía Then se trata como texto plano y no se renderiza ni ejecuta en ninguna página del sitio.
  - Given el campo mensaje When se muestra Then el aviso "no incluyas información de salud ni datos emocionales sensibles" es visible junto al campo y está vinculado con `aria-describedby`.
  - Given todas las etiquetas When se inspeccionan Then cada campo tiene `<label>` visible (no solo placeholder), `name` y `autocomplete` apropiados (name, email, tel, organization).
  - Given validación en cliente deshabilitada o evadida When el proveedor recibe datos inválidos Then el proveedor/regla del lado servidor rechaza o el equipo lo descarta (la validación de cliente no es control de seguridad).

### RF-09 Anti-spam
- Prioridad: Must
- Criterios:
  - Given el formulario When se renderiza Then incluye un campo honeypot invisible para usuarios y lectores de pantalla (`aria-hidden`, `tabindex=-1`, sin autocomplete) y, en producción, un captcha sin fricción (tipo Turnstile/hCaptcha invisible/similar; se elige junto con el proveedor real del formulario; en modo demo no hay captcha).
  - Given el honeypot relleno When se envía Then la solicitud se descarta por el proveedor o el cliente, el usuario ve la misma confirmación de éxito y no llega correo al equipo.
  - Given el captcha falla o no carga (bloqueado por extensión/red) When el usuario envía Then se muestra mensaje de error accionable con el fallback de contacto (RF-10), sin perder lo escrito.
  - Given envíos repetidos (> N por minuto desde la misma sesión; N a definir en design) When ocurren Then el botón se deshabilita mientras hay envío en curso y el proveedor aplica rate limit.
  - Given un usuario con teclado/lector de pantalla When resuelve el captcha Then no se exige un desafío visual inaccesible sin alternativa.

### RF-10 Estados de envío y fallback de contacto
- Prioridad: Must
- Criterios:
  - Given envío válido When se pulsa "Enviar" Then el botón se deshabilita y muestra estado "Enviando…" (`aria-busy`, anuncio en región `aria-live=polite`); un doble clic produce una sola solicitud.
  - Given respuesta 2xx del proveedor When llega Then se muestra confirmación ("Gracias, te responderemos…") en región `aria-live`, el formulario se limpia y el foco pasa al mensaje; no se muestra el éxito antes de recibir la respuesta.
  - Given respuesta 4xx/5xx, error de red u offline, o sin respuesta en 10 s (timeout, umbral ajustable) When ocurre Then se muestra un mensaje de error y los enlaces de contacto alternativo (mailto del email de Confluye), los datos escritos se conservan y se puede reintentar.
  - Given el proveedor responde 429 (límite) When ocurre Then mensaje específico "inténtalo más tarde" con fallback.
  - Given JS deshabilitado When se visita Then el formulario muestra el contacto alternativo (email) en lugar de quedar roto (o el formulario funciona vía POST nativo al proveedor, decisión de design).
  - Given el sitio construido en **modo demo** (adaptador de envío `demo`, usado en la preview de GitHub Pages mientras no hay proveedor real) When se envía un formulario válido Then no se realiza ninguna petición de red con los datos, se simula la respuesta (éxito por defecto; error/timeout reproducibles para pruebas) y se muestra un aviso visible y accesible "Formulario de prueba: tus datos no se envían ni se guardan".
  - Given un build de producción When el adaptador configurado es `demo` o falta el endpoint del proveedor Then el build de producción falla (no se publica un formulario que no entrega solicitudes).
  - Given el envío ocurre When se completa Then ningún dato personal queda en `localStorage`, cookies, URL ni consola del navegador.

### RF-11 Consentimiento informado y política de privacidad (es/en)
- Prioridad: Must
- Criterios:
  - Given el formulario When carga Then el checkbox de consentimiento aparece desmarcado, con texto claro sobre finalidad (atender la solicitud de contacto) y enlace a la política de privacidad en el idioma activo.
  - Given checkbox sin marcar When se intenta enviar Then error asociado al campo y no se envía.
  - Given el envío When se realiza Then el payload incluye el estado de consentimiento, la versión de la política y la marca de tiempo (para evidencia), según capacidad del proveedor.
  - Given la política (`/privacidad` y `/en/privacy`, rutas a definir) When se abre Then es una página estática que contiene al menos: titular del banco de datos (razón social/persona, RUC, domicilio), finalidad, datos recogidos, destinatarios/encargados (proveedor de formularios y email), transferencia internacional, plazo de conservación, derechos ARCO y canal para ejercerlos, carácter facultativo de los datos, fecha/versión (ver `compliance.md`).
  - Given la política en construcción por falta de datos del titular When se intenta publicar Then la build falla o el pipeline marca bloqueo (no se publica con placeholders tipo "[RUC]"); verificable con test que busca marcadores `TODO|\[.*\]`.
  - Given el enlace a la política When se abre desde el formulario Then se abre sin perder lo escrito (misma pestaña con retorno no destructivo o `target=_blank` con `rel="noopener"`).

### RF-12 Sitio bilingüe es/en con selector de idioma
- Prioridad: Must
- Criterios:
  - Given `/` When carga Then está en español (`<html lang="es">`); Given `/en/` Then en inglés (`lang="en"`).
  - Given cada página When se inspecciona Then incluye `<link rel="alternate" hreflang>` para es, en y x-default, y canonical por idioma.
  - Given el selector de idioma When se activa Then lleva a la misma sección/página en el otro idioma (conservando el hash cuando exista) y su nombre accesible indica el idioma destino.
  - Given una clave de contenido sin traducción When se hace build Then el build falla (paridad de claves es/en verificada por test).
  - Given el visitante con navegador en inglés que entra a `/` When carga Then no se redirige automáticamente (el idioma se elige por selector); sugerencia opcional no bloqueante (Could).
  - Given el formulario en `/en/` When hay errores Then mensajes de validación, aviso de mensaje y política enlazada están en inglés.

### RF-13 Mobile-first y responsive (requisito transversal)
Como visitante desde móvil quiero usar todo el sitio cómodamente con una mano.
- Prioridad: Must
- Criterios:
  - Given el CSS When se revisa Then está escrito mobile-first (base para 360 px; `min-width` media queries en ≈768/1024/1440); verificable con lint que prohíbe `max-width` en media queries de layout.
  - Given viewports de 320 a 1920 px (barrido por pasos) When se carga cada página Then `scrollWidth <= clientWidth` (sin scroll horizontal).
  - Given cualquier control interactivo (enlaces de menú, botones, checkbox, select, selector de idioma, redes) When se mide en 360 px Then su área táctil es ≥ 44×44 px y la separación entre objetivos evita solapes.
  - Given el texto base When se mide Then es ≥ 16 px en todos los viewports; tipografía fluida (`clamp()`), sin zoom forzado en iOS al enfocar inputs, zoom de usuario no bloqueado (`user-scalable` no deshabilitado).
  - Given imágenes When se sirven Then usan `srcset`/`sizes`, formatos AVIF/WebP con fallback, `width/height` y `loading=lazy` salvo la imagen LCP.
  - Given el formulario en móvil When se usa Then los inputs tienen `type`/`inputmode`/`autocomplete` adecuados, el teclado correcto aparece y el campo enfocado no queda tapado por la cabecera fija ni por otros elementos fijos.
  - Given zoom 200 % y texto ampliado When se navega Then no hay pérdida de contenido ni funcionalidad (reflow WCAG 1.4.10 a 320 px CSS).
  - Given orientación vertical y horizontal When se rota un móvil Then el layout se adapta sin romper.
  - Given Playwright con emulación (móvil ≈360×800, tablet ≈768×1024, escritorio ≈1440×900; incluye WebKit) When corre la suite Then todos los RF Must de interfaz pasan en los 3 perfiles.

### RF-14 (retirado)
- Prioridad: Won't — el botón de WhatsApp se retiró por decisión del cliente (2026-10-27); el único canal es el formulario (fallback: email).

### RF-15 Enlaces a redes sociales
- Prioridad: Must (el cliente aún no tiene redes: en desarrollo/preview se usan enlaces de prueba marcados como demo; en producción se ocultan las redes sin URL real)
- Criterios:
  - Given el footer (y/o contacto) When se renderiza Then hay un enlace por red confirmada con nombre accesible ("CONFLUYE en Instagram"), `rel="noopener noreferrer"`, apertura en pestaña nueva y destino HTTPS.
  - Given una red marcada como demo When se hace build de desarrollo/preview Then se renderiza con un enlace de prueba (`#` o perfil genérico) identificado como demo en la configuración.
  - Given una red sin URL real When se hace build de producción Then no se renderiza (ni enlace demo ni placeholder) y el footer sigue íntegro.
  - Given los iconos son SVG When se inspeccionan Then son decorativos (`aria-hidden`) con el nombre en el enlace; objetivos ≥ 44×44 px.

### RF-16 Footer con datos legales
- Prioridad: Must
- Criterios:
  - Given cualquier página When se ve el footer Then contiene: nombre/razón social del titular, enlace a política de privacidad, email de contacto, redes, selector de idioma y año vigente.
  - Given falta algún dato legal confirmado When se intenta desplegar a producción Then el pipeline lo bloquea (misma regla que RF-11).

### RF-17 Analítica sin cookies
- Prioridad: Should
- Criterios:
  - Given analítica activa When un visitante entra Then no se escribe ninguna cookie ni se usa `localStorage`/`sessionStorage` para identificar (verificable en Playwright con inspección de `document.cookie` y storage).
  - Given la señal Do Not Track / GPC When está activa Then no se envía evento (si el proveedor lo permite).
  - Given el script de analítica falla o está bloqueado When ocurre Then el sitio funciona igual y sin errores en consola que rompan UI.
  - Given eventos medidos When se definen Then incluyen al menos: vista de página, clic CTA, envío exitoso, sin enviar contenido del formulario ni IP completa.
  - Given la analítica When se despliega Then se menciona en la política de privacidad.

### RF-18 Presentación del equipo
- Prioridad: Could (depende de que exista contenido; ver pregunta 12)
- Criterios:
  - Given el cliente aporta fotos y bios con consentimiento When se agrega la sección Then cada integrante tiene foto con `alt`, nombre y rol, en es/en.
  - Given no hay contenido When se hace build Then la sección no se renderiza ni aparece en el menú.

### RF-19 Testimonios
- Prioridad: Could (depende de existencia y autorización escrita de cada testimonio)
- Criterios:
  - Given testimonios con autorización escrita When se publican Then se muestran con nombre o iniciales autorizados y sin información de salud/sensible.
  - Given no hay testimonios autorizados When se hace build Then no se renderiza la sección.

### RF-20 Fuera de alcance (Won't)
- Prioridad: Won't (esta versión): blog, CMS, área privada/login, pagos o reservas, base de datos propia, chat en vivo, botón de WhatsApp (retirado 2026-10-27, ver RF-14).

## 4. Requisitos no funcionales
Ver `nfr.md` (cada RNF medible y con método de verificación).

## 5. Reglas de negocio

- RN-01 El único canal de captación es el formulario (más el email visible como alternativa); el sitio no almacena datos de visitantes.
- RN-02 Sin consentimiento marcado no se envía el formulario; el checkbox nunca viene premarcado.
- RN-03 Organización es obligatoria solo si tipo=organización.
- RN-04 El servicio de interés es una lista cerrada: las 8 modalidades del copy + "No estoy seguro/a".
- RN-05 No se solicitan datos sensibles (salud, emocionales detallados, menores identificables, etc.); el aviso en el campo mensaje es obligatorio. Si llegan, aplica el procedimiento de `compliance.md` (§ Datos sensibles recibidos por error).
- RN-06 Los datos del formulario se usan únicamente para atender la solicitud de contacto; no se usan para marketing sin un consentimiento adicional y separado.
- RN-07 Contenido del cliente = fuente de verdad; cambios de texto pasan por el cliente. Las traducciones al inglés las redacta Claude y las revisa el cliente antes de publicar (propuesta, pregunta 6).
- RN-08 No se publica a producción con datos legales o redes sin confirmar (placeholders bloquean el despliegue).
- RN-09 Servicios dirigidos a niños y adolescentes: el formulario es para adultos (mayores de 18) o representantes; confirmar texto con el cliente (pregunta 14; regla sin confirmar, no se asume).
- RN-10 Tiempo de respuesta del equipo a contactos: no definido (pregunta 15); no se promete plazo en el sitio hasta que se confirme.

## 6. Datos (entidades, sensibilidad, retención)

El sitio no tiene base de datos. La única entidad es el envío del formulario, que existe en el proveedor externo y en la bandeja de email de Confluye.

| Entidad / campo | Obligatorio | Sensibilidad | Notas |
|---|---|---|---|
| Envío.nombre | Sí | Dato personal | Texto, ≤ 100 caracteres |
| Envío.email | Sí | Dato personal | Formato email |
| Envío.teléfono | No | Dato personal | Opcional |
| Envío.tipo (persona/organización) | Sí | No sensible | Enum |
| Envío.organización | Condicional | Dato de persona jurídica / posible dato personal | Solo si tipo=organización |
| Envío.servicio de interés | Sí | No sensible | Enum de 9 valores |
| Envío.mensaje | No (opcional) | Riesgo de datos sensibles por texto libre | Límite 500 caracteres + aviso; mitigación en compliance |
| Envío.consentimiento (bool, versión política, marca de tiempo, idioma) | Sí | Evidencia de cumplimiento | Dependiente de lo que registre el proveedor |
| Metadatos técnicos del proveedor (IP, user agent, fecha) | Automático | Dato personal (IP) | Depende del proveedor; minimizar/desactivar si es posible |

Retención (aprobada por el cliente 2026-10-27): eliminar envíos del proveedor y de la bandeja cuando se resuelva la solicitud o a más tardar a los 12 meses, salvo que la persona se convierta en cliente (otra base legal/contrato). Sin datos en el navegador del visitante tras el envío.

## 7. Integraciones externas

| Integración | Uso | Datos que viajan | Fallo/degradación |
|---|---|---|---|
| Proveedor de formularios/email (a decidir en design: p. ej. Formspree, Web3Forms, Basin, Netlify Forms, Cloudflare Worker + email; criterios: ubicación de datos, DPA, rate limit, captcha, plan gratuito, export/borrado) | Recibir el POST y reenviar por email a Confluye | Campos del formulario + metadatos | Timeout 10 s, mensaje de error y fallback mailto (RF-10) |
| Captcha sin fricción (Turnstile/hCaptcha/similar) | Anti-bot | Señales del navegador, IP | Si falla, mensaje y fallback |
| Analítica sin cookies (Should; p. ej. Plausible/Umami/Cloudflare Web Analytics) | Métricas agregadas | Página, referrer, país; sin ID persistente | Opcional; si falla no afecta al sitio |
| Hosting estático/CDN (Netlify/Cloudflare Pages/Vercel, se decide en design) | Servir el sitio | Logs de acceso del hosting | Sin lock-in (build estático portable) |
| Fuentes tipográficas | Tipografía | Preferible autoalojadas (sin petición a terceros) | Fuente del sistema como fallback |

## 8. Preguntas abiertas

Bloqueantes (impiden publicar o cerrar design):
1. ~~Email destino~~ → `jesusarturo965@gmail.com` (provisional, 2026-10-27). Pendiente: ¿email público distinto o propio del dominio?
2. Titular del banco de datos (nombre comercial: Confluye; sin RUC por el momento): razón social o persona natural, RUC, domicilio, y quién atiende derechos ARCO (nombre/canal).
3. ¿El banco de datos está inscrito ante la ANPD (Registro Nacional de Protección de Datos Personales)? Si no, ¿se inscribirá antes del lanzamiento? (ver compliance.md).
4. Dominio del sitio (¿existe? ¿quién lo registra y administra DNS?).
5. ~~WhatsApp~~ → no aplica: retirado por el cliente (2026-10-27).
6. Traducción al inglés: borrador redactado por Claude en `src/content/en/` con `meta.draft: true` (2026-10-28); **pendiente de revisión del cliente** (bloquea producción, T-034).
7. ~~Plazo de retención~~ → resuelto: hasta resolver la solicitud, máx. 12 meses.

Importantes (afectan alcance o diseño, no bloquean el inicio de design):
8. URLs de redes sociales: aún no existen; se usan enlaces demo en desarrollo (RF-15).
9. Logo en SVG o PNG con fondo transparente (el actual es JPEG raster 1024×559, limita nitidez, fondo y favicon).
10. ~~Mensaje~~ → resuelto: opcional, máx. 500 caracteres.
11. Formato de teléfono aceptado (solo Perú +51 o internacional).
12. ¿Existen integrantes del equipo y testimonios publicables (con autorización escrita)? Define RF-18 y RF-19.
13. ¿El cliente acepta que el proveedor de formularios procese datos fuera de Perú (p. ej. EE. UU.)? ¿Alguna preferencia de proveedor o presupuesto?
14. ¿Menores de edad: el formulario es solo para mayores de 18 / responsables? ¿Texto de aviso?
15. Tiempo de respuesta comprometido y horario de atención (para mostrar en el sitio, si aplica).
16. ¿Se usará analítica (Should) y cuál es el proveedor preferido? ¿Se aprobó el uso sin cookies?
17. Paleta y tipografías: ¿hay manual de marca más allá del logo (teal / melocotón / verde hoja)?

## 9. Riesgos detectados

- Datos sensibles llegando por el campo libre de mensaje (mitigación: aviso, límite de caracteres, procedimiento de eliminación).
- Datos legales del titular y registro ANPD sin definir: bloquean la política de privacidad y la salida a producción.
- Transferencia internacional a través del proveedor de formularios; elegir proveedor con DPA y comunicarlo en la política.
- Logo raster con fondo: calidad limitada en pantallas de alta densidad y favicon.
- Spam y fallo del captcha reduciendo conversión; fallback obligatorio.
- Traducción al inglés sin revisión nativa.
