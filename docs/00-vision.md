# Visión — confluye

- **Problema**: Confluye, consultora peruana de bienestar humano, no tiene presencia web propia que explique su enfoque y capte contactos de personas y organizaciones interesadas.
- **Concepto**: "Espacio de encuentro humano donde las personas, sus emociones, relaciones y experiencias se convierten en punto de partida para construir bienestar individual y colectivo".
- **Usuarios / actores**: personas que buscan acompañamiento; organizaciones (empresas, instituciones, comunidades) que buscan intervenciones de bienestar; equipo de Confluye (recibe y responde los contactos).
- **Propuesta de valor**: comunicar con calidez y claridad el propósito, la propuesta de valor, públicos y ámbitos de intervención, modalidades de servicio, enfoque diferencial e impacto social esperado (contenido aportado por el cliente), y facilitar el primer contacto.
- **Alcance**: landing de una página (Astro SSG) con secciones de contenido, formulario de contacto propio con consentimiento informado y política de privacidad.
- **Objetivos medibles (KPIs)**: contactos válidos recibidos/mes; tasa de envío del formulario; Lighthouse ≥ 90 en las 4 categorías; WCAG 2.2 AA; LCP < 2,5 s en móvil 4G.
- **Fuera de alcance**: blog, CMS, área privada, pagos/reservas, multi-idioma (salvo que se pida en req).
- **Restricciones**: opera en Perú → Ley 29733 de Protección de Datos Personales y su Reglamento (consentimiento, finalidad, banco de datos, derechos ARCO); marca/logo y textos los aporta el cliente; hosting estático (Netlify / Cloudflare Pages / Vercel, se decide en design); sin backend propio.
- **Supuestos y riesgos principales**: el envío del formulario se delega a un proveedor externo (riesgo: transferencia de datos a terceros/extranjero, spam); el contenido llega a tiempo; el tono visual debe transmitir calidez sin caer en plantilla genérica.
