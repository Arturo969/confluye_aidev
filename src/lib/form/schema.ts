// Dominio del formulario de contacto (ContactPayload v1, data-model.md). TS puro: sin DOM ni astro:*.
// La validación de cliente es usabilidad, no control de seguridad (ADR-0003).

export const SERVICE_IDS = [
  'specialized-consulting',
  'wellbeing-diagnostics',
  'workshops',
  'intervention-programs',
  'training',
  'applied-research',
  'social-project-design',
  'organizational-support',
  'not-sure',
] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export const CONTACT_TYPES = ['person', 'organization'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const LIMITS = {
  name: 100,
  organization: 120,
  email: 254,
  message: 500,
  phoneMinDigits: 7,
  phoneMaxDigits: 15,
  phoneMaxChars: 20,
} as const;

export type FieldName =
  'name' | 'email' | 'phone' | 'type' | 'organization' | 'service' | 'message' | 'consent';
export type ErrorCode = 'required' | 'too_long' | 'invalid';
export type FieldErrors = Partial<Record<FieldName, ErrorCode>>;

/** Valores tal como llegan del formulario (sin validar). */
export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  type: string;
  organization: string;
  service: string;
  message: string;
  consent: boolean;
}

/** Valores validados y recortados. */
export interface ValidContact {
  name: string;
  email: string;
  phone: string;
  type: ContactType;
  organization: string;
  service: ServiceId;
  message: string;
}

export type ValidationResult =
  { ok: true; value: ValidContact } | { ok: false; errors: FieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS = /^[+\d\s()-]+$/;

/** Longitud en caracteres visibles (un emoji cuenta 1), no en unidades UTF-16. */
const charCount = (value: string): number => [...value].length;

function checkText(value: string, max: number, required: boolean): ErrorCode | undefined {
  if (!value) return required ? 'required' : undefined;
  return charCount(value) > max ? 'too_long' : undefined;
}

function checkEmail(value: string): ErrorCode | undefined {
  if (!value) return 'required';
  if (charCount(value) > LIMITS.email) return 'too_long';
  return EMAIL_PATTERN.test(value) ? undefined : 'invalid';
}

function checkPhone(value: string): ErrorCode | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '').length;
  const valid =
    PHONE_CHARS.test(value) &&
    value.length <= LIMITS.phoneMaxChars &&
    digits >= LIMITS.phoneMinDigits &&
    digits <= LIMITS.phoneMaxDigits;
  return valid ? undefined : 'invalid';
}

function checkEnum(list: readonly string[], value: string): ErrorCode | undefined {
  if (!value) return 'required';
  return list.includes(value) ? undefined : 'invalid';
}

export function validateContact(input: ContactInput): ValidationResult {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const type = input.type.trim();
  const organization = input.organization.trim();
  const service = input.service.trim();
  const message = input.message.trim();
  const isOrganization = type === 'organization';

  const candidates: Record<FieldName, ErrorCode | undefined> = {
    name: checkText(name, LIMITS.name, true),
    email: checkEmail(email),
    phone: checkPhone(phone),
    type: checkEnum(CONTACT_TYPES, type),
    organization: isOrganization ? checkText(organization, LIMITS.organization, true) : undefined,
    service: checkEnum(SERVICE_IDS, service),
    message: checkText(message, LIMITS.message, false),
    consent: input.consent ? undefined : 'required',
  };
  const errors = Object.fromEntries(
    Object.entries(candidates).filter(([, code]) => code !== undefined),
  ) as FieldErrors;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  // Sin errores, checkEnum ya garantizó que type y service pertenecen a sus listas.
  return {
    ok: true,
    value: {
      name,
      email,
      phone,
      type: type as ContactType,
      organization: isOrganization ? organization : '',
      service: service as ServiceId,
      message,
    },
  };
}
