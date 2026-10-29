import type { Locale } from '../i18n/routes';
import type { ContactType, ServiceId, ValidContact } from './schema';

export const SCHEMA_VERSION = 1;

/** Payload canónico v1 (data-model.md). Los adaptadores lo traducen al formato del proveedor. */
export interface ContactPayload {
  schemaVersion: typeof SCHEMA_VERSION;
  name: string;
  email: string;
  phone?: string;
  type: ContactType;
  organization?: string;
  service: ServiceId;
  message?: string;
  consent: {
    given: true;
    policyVersion: string;
    timestamp: string;
    locale: Locale;
  };
}

export interface PayloadMeta {
  policyVersion: string;
  locale: Locale;
  now: Date;
}

/** Copia solo los campos del esquema: nada ajeno (honeypot, extras) llega al proveedor. */
export function buildPayload(value: ValidContact, meta: PayloadMeta): ContactPayload {
  return {
    schemaVersion: SCHEMA_VERSION,
    name: value.name,
    email: value.email,
    ...(value.phone && { phone: value.phone }),
    type: value.type,
    ...(value.type === 'organization' && { organization: value.organization }),
    service: value.service,
    ...(value.message && { message: value.message }),
    consent: {
      given: true,
      policyVersion: meta.policyVersion,
      timestamp: meta.now.toISOString(),
      locale: meta.locale,
    },
  };
}
