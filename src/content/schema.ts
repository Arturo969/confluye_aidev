// Esquema del contenido por idioma (data-model.md). Se valida en build; zod nunca llega al cliente.
import { z } from 'astro/zod';
import { SERVICE_IDS } from '../lib/form/schema';

const text = z.string().min(1);
const titled = z.strictObject({ id: text, title: text, text });
const field = z.strictObject({ label: text, hint: text.optional() });

// Con claves enum, z.record exige los 9 servicios. Solo `not-sure` carece de descripción
// (lo verifica tests/unit/content.test.ts).
const serviceItems = z.record(
  z.enum(SERVICE_IDS),
  z.strictObject({ label: text, description: text.optional() }),
);

export const contentSchema = z.strictObject({
  meta: z.strictObject({ draft: z.boolean() }),
  seo: z.strictObject({ title: text.max(60), description: text.max(160), ogImageAlt: text }),
  nav: z.strictObject({
    items: z.array(z.strictObject({ anchor: text, label: text })).min(1),
    menuOpen: text,
    menuClose: text,
    skipLink: text,
    home: text,
    langSwitch: z.strictObject({ label: text, targetName: text }),
  }),
  hero: z.strictObject({ tagline: text, lead: text, cta: text }),
  concept: z.strictObject({
    title: text,
    ideas: z.array(z.strictObject({ term: text, meaning: text })).length(4),
    conceptTitle: text,
    concept: text,
    descriptionTitle: text,
    description: z.array(text).length(5),
    purposeTitle: text,
    purpose: text,
  }),
  value: z.strictObject({
    title: text,
    intro: z.array(text).min(1),
    dimensions: z.array(titled).length(6),
  }),
  audiences: z.strictObject({
    title: text,
    intro: text,
    items: z
      .array(z.strictObject({ id: text, title: text, lines: z.array(text).min(1) }))
      .length(5),
  }),
  services: z.strictObject({ title: text, intro: text, items: serviceItems }),
  approach: z.strictObject({
    title: text,
    positioning: text,
    premise: text,
    questions: z.array(text).length(4),
    closing: text,
    impactTitle: text,
    impactIntro: text,
    impactLevels: z.array(titled).length(5),
    synthesis: text,
  }),
  form: z.strictObject({
    title: text,
    intro: text,
    fields: z.strictObject({
      name: field,
      email: field,
      phone: field,
      type: field,
      organization: field,
      service: field,
      message: field,
    }),
    types: z.strictObject({ person: text, organization: text }),
    servicePlaceholder: text,
    messageWarning: text,
    charCounter: text,
    consentText: text,
    consentLinkLabel: text,
    submit: text,
    sending: text,
    errorSummaryTitle: text,
    errors: z.strictObject({
      required: text,
      too_long: text,
      invalid: text,
      emailInvalid: text,
      phoneInvalid: text,
      consentRequired: text,
    }),
    status: z.strictObject({
      success: text,
      validation: text,
      captcha: text,
      rateLimited: text,
      network: text,
      timeout: text,
      server: text,
    }),
    fallback: z.strictObject({ text, emailLabel: text }),
    noscript: text,
    demoNotice: text,
  }),
  footer: z.strictObject({
    legalHolderLabel: text,
    privacyLink: text,
    contactLabel: text,
    socialLabel: text,
    copyright: text,
  }),
});

export type Content = z.infer<typeof contentSchema>;

export const siteSchema = z.strictObject({
  email: z.email(),
  legalHolder: z.strictObject({ name: text, ruc: text, address: text }),
  social: z.array(z.strictObject({ network: text, url: z.url(), demo: z.boolean() })),
});

export type Site = z.infer<typeof siteSchema>;
