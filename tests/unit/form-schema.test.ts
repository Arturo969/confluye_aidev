import { describe, expect, it } from 'vitest';
import { LIMITS, SERVICE_IDS, validateContact, type ContactInput } from '../../src/lib/form/schema';

const valid: ContactInput = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  phone: '',
  type: 'person',
  organization: '',
  service: 'workshops',
  message: '',
  consent: true,
};

const errorsOf = (input: Partial<ContactInput>) => {
  const result = validateContact({ ...valid, ...input });
  return result.ok ? {} : result.errors;
};

describe('validateContact', () => {
  it('acepta un envío mínimo válido', () => {
    expect(validateContact(valid).ok).toBe(true);
  });

  it('expone los 9 servicios del modelo de datos', () => {
    expect(SERVICE_IDS).toHaveLength(9);
    expect(SERVICE_IDS).toContain('not-sure');
  });

  describe('nombre', () => {
    it('es obligatorio y solo espacios cuenta como vacío', () => {
      expect(errorsOf({ name: '' }).name).toBe('required');
      expect(errorsOf({ name: '   ' }).name).toBe('required');
    });

    it(`acepta ${LIMITS.name} caracteres y rechaza ${LIMITS.name + 1}`, () => {
      expect(errorsOf({ name: 'a'.repeat(LIMITS.name) }).name).toBeUndefined();
      expect(errorsOf({ name: 'a'.repeat(LIMITS.name + 1) }).name).toBe('too_long');
    });

    it('mide tras recortar espacios', () => {
      expect(errorsOf({ name: `  ${'a'.repeat(LIMITS.name)}  ` }).name).toBeUndefined();
    });
  });

  describe('email', () => {
    it('es obligatorio', () => {
      expect(errorsOf({ email: ' ' }).email).toBe('required');
    });

    it.each(['a@b', 'ana@', '@example.com', 'ana example@x.com', 'ana@example'])(
      'rechaza %s',
      (email) => {
        expect(errorsOf({ email }).email).toBe('invalid');
      },
    );

    it('acepta formatos habituales', () => {
      expect(errorsOf({ email: 'ana.perez+web@sub.example.pe' }).email).toBeUndefined();
    });

    it(`rechaza más de ${LIMITS.email} caracteres`, () => {
      const email = `${'a'.repeat(LIMITS.email)}@x.com`;
      expect(errorsOf({ email }).email).toBe('too_long');
    });
  });

  describe('teléfono (opcional)', () => {
    it('vacío es válido', () => {
      expect(errorsOf({ phone: '' }).phone).toBeUndefined();
      expect(errorsOf({ phone: '   ' }).phone).toBeUndefined();
    });

    it.each(['+51 956 262 070', '(01) 234-5678', '9562620'])('acepta %s', (phone) => {
      expect(errorsOf({ phone }).phone).toBeUndefined();
    });

    it.each(['95626abc', '123456', '1234567890123456', '+51 956 262 070 000 00'])(
      'rechaza %s',
      (phone) => {
        expect(errorsOf({ phone }).phone).toBe('invalid');
      },
    );
  });

  describe('tipo y organización', () => {
    it('rechaza un tipo fuera del enum', () => {
      expect(errorsOf({ type: 'empresa' }).type).toBe('invalid');
    });

    it('organización es obligatoria solo si el tipo es organización', () => {
      expect(errorsOf({ type: 'organization', organization: ' ' }).organization).toBe('required');
      expect(errorsOf({ type: 'person', organization: '' }).organization).toBeUndefined();
    });

    it(`rechaza organización de más de ${LIMITS.organization} caracteres`, () => {
      const organization = 'o'.repeat(LIMITS.organization + 1);
      expect(errorsOf({ type: 'organization', organization }).organization).toBe('too_long');
    });

    it('ignora la organización escrita si el tipo es persona', () => {
      const organization = 'o'.repeat(LIMITS.organization + 1);
      expect(errorsOf({ type: 'person', organization }).organization).toBeUndefined();
    });
  });

  describe('servicio', () => {
    it('es obligatorio y debe pertenecer a la lista', () => {
      expect(errorsOf({ service: '' }).service).toBe('required');
      expect(errorsOf({ service: 'hacking' }).service).toBe('invalid');
    });
  });

  describe('mensaje (opcional)', () => {
    it(`acepta ${LIMITS.message} caracteres y rechaza ${LIMITS.message + 1}`, () => {
      expect(errorsOf({ message: 'm'.repeat(LIMITS.message) }).message).toBeUndefined();
      expect(errorsOf({ message: 'm'.repeat(LIMITS.message + 1) }).message).toBe('too_long');
    });

    it('cuenta caracteres, no unidades UTF-16 (emoji = 1)', () => {
      expect(errorsOf({ message: '🙂'.repeat(LIMITS.message) }).message).toBeUndefined();
    });

    it('acepta HTML como texto plano (no se interpreta aquí)', () => {
      expect(errorsOf({ message: '<script>alert(1)</script>' }).message).toBeUndefined();
    });
  });

  describe('consentimiento', () => {
    it('es obligatorio', () => {
      expect(errorsOf({ consent: false }).consent).toBe('required');
    });
  });

  it('devuelve el valor recortado cuando es válido', () => {
    const result = validateContact({ ...valid, name: '  Ana  ', email: ' ana@example.com ' });
    expect(result.ok && result.value).toMatchObject({ name: 'Ana', email: 'ana@example.com' });
  });

  it('acumula un error por campo', () => {
    const errors = errorsOf({ name: '', email: 'x', consent: false });
    expect(Object.keys(errors).sort()).toEqual(['consent', 'email', 'name']);
  });
});
