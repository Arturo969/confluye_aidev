import { describe, expect, it } from 'vitest';
import { buildPayload } from '../../src/lib/form/payload';
import type { ValidContact } from '../../src/lib/form/schema';

const base: ValidContact = {
  name: 'Ana',
  email: 'ana@example.com',
  phone: '',
  type: 'person',
  organization: '',
  service: 'training',
  message: '',
};
const meta = {
  policyVersion: '2026-10-27.1',
  locale: 'es' as const,
  now: new Date(Date.UTC(2026, 9, 28, 15, 30)),
};

describe('buildPayload', () => {
  it('construye ContactPayload v1 con consentimiento como evidencia', () => {
    expect(buildPayload(base, meta)).toEqual({
      schemaVersion: 1,
      name: 'Ana',
      email: 'ana@example.com',
      type: 'person',
      service: 'training',
      consent: {
        given: true,
        policyVersion: '2026-10-27.1',
        timestamp: '2026-10-28T15:30:00.000Z',
        locale: 'es',
      },
    });
  });

  it('omite organización para personas e incluye la de organizaciones', () => {
    expect(buildPayload({ ...base, organization: 'Colegio X' }, meta)).not.toHaveProperty(
      'organization',
    );
    expect(
      buildPayload({ ...base, type: 'organization', organization: 'Colegio X' }, meta),
    ).toMatchObject({ organization: 'Colegio X' });
  });

  it('incluye teléfono y mensaje solo si tienen contenido', () => {
    const payload = buildPayload({ ...base, phone: '+51 956 262 070', message: 'Hola' }, meta);
    expect(payload).toMatchObject({ phone: '+51 956 262 070', message: 'Hola' });
    expect(buildPayload(base, meta)).not.toHaveProperty('phone');
    expect(buildPayload(base, meta)).not.toHaveProperty('message');
  });

  it('nunca incluye campos ajenos al esquema (p. ej. honeypot)', () => {
    const withExtra = { ...base, company_url: 'http://spam' } as ValidContact;
    expect(buildPayload(withExtra, meta)).not.toHaveProperty('company_url');
  });
});
