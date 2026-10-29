import { describe, expect, it } from 'vitest';
import { contentSchema } from '../../src/content/schema';
import { getContent, getSite, keyPaths } from '../../src/lib/i18n/content';
import { SERVICE_IDS } from '../../src/lib/form/schema';

const es = getContent('es');
const en = getContent('en');

describe('keyPaths', () => {
  it('lista rutas de objetos y arrays anidados', () => {
    expect(keyPaths({ a: { b: 1 }, c: [{ d: 'x' }, { d: 'y' }] })).toEqual([
      'a.b',
      'c.0.d',
      'c.1.d',
    ]);
  });
});

describe('paridad es/en (RF-12)', () => {
  it('ambos idiomas tienen exactamente el mismo árbol de claves', () => {
    expect(keyPaths(en)).toEqual(keyPaths(es));
  });
});

describe('esquema de contenido', () => {
  it('rechaza contenido con una clave ausente', () => {
    const withoutHero: Partial<typeof es> = { ...es };
    delete withoutHero.hero;
    expect(contentSchema.safeParse(withoutHero).success).toBe(false);
  });

  it('rechaza contenido con un tipo erróneo', () => {
    expect(
      contentSchema.safeParse({ ...es, value: { ...es.value, dimensions: 'x' } }).success,
    ).toBe(false);
  });

  it('exige 6 dimensiones, 5 públicos y 5 niveles de impacto', () => {
    expect(es.value.dimensions).toHaveLength(6);
    expect(es.audiences.items).toHaveLength(5);
    expect(es.approach.impactLevels).toHaveLength(5);
    expect(es.approach.questions).toHaveLength(4);
  });

  it('tiene una etiqueta por cada servicio del formulario (RN-04)', () => {
    expect(Object.keys(es.services.items).sort()).toEqual([...SERVICE_IDS].sort());
    const described = SERVICE_IDS.filter((id) => id !== 'not-sure');
    for (const id of described) expect(es.services.items[id].description).toBeTruthy();
  });
});

describe('estado de revisión (RN-07)', () => {
  it('el español es definitivo y el inglés es un borrador pendiente de revisión', () => {
    expect(es.meta.draft).toBe(false);
    expect(en.meta.draft).toBe(true);
  });
});

describe('navegación', () => {
  it('usa las mismas anclas en ambos idiomas para conservar el hash al cambiar de idioma', () => {
    const anchors = es.nav.items.map((i) => i.anchor);
    expect(anchors).toEqual([
      'concepto',
      'valor',
      'publicos',
      'modalidades',
      'enfoque',
      'contacto',
    ]);
    expect(en.nav.items.map((i) => i.anchor)).toEqual(anchors);
  });
});

describe('sin textos de relleno ni meta-comentarios del cliente', () => {
  it.each([
    ['es', es],
    ['en', en],
  ])('%s', (_locale, content) => {
    const text = JSON.stringify(content);
    expect(text).not.toContain('[Nombre del emprendimiento]');
    expect(text).not.toMatch(/Mi propuesta|Esta combinación me parece/);
  });
});

describe('datos no traducibles (site.json)', () => {
  it('valida email y marca las redes y datos legales pendientes para que producción los bloquee', () => {
    const site = getSite();
    expect(site.email).toMatch(/@/);
    expect(site.social.every((s) => s.demo)).toBe(true);
    expect(site.legalHolder.ruc).toMatch(/^\[[A-Z]+\]$/);
  });
});
