import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/lib/i18n/content';

// El copy en español debe ser literal al del cliente (RN-07). Única sustitución aprobada:
// "[Nombre del emprendimiento]" → "CONFLUYE".
const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
const source = normalize(
  readFileSync('docs/research/contenido-cliente.md', 'utf8').replaceAll(
    '[Nombre del emprendimiento]',
    'CONFLUYE',
  ),
);

const es = getContent('es');
const joined = (title: string, text: string) => `${title}: ${text}`;

const clientTexts: string[] = [
  ...es.concept.ideas.map((i) => `${i.term} → ${i.meaning}`),
  es.concept.concept,
  ...es.concept.description,
  es.concept.purpose,
  ...es.value.intro,
  ...es.value.dimensions.map((d) => joined(d.title, d.text)),
  es.audiences.intro,
  ...es.audiences.items.flatMap((a) => [a.title, ...a.lines]),
  es.services.intro,
  ...Object.entries(es.services.items)
    .filter(([id]) => id !== 'not-sure')
    .map(([, s]) => joined(s.label, s.description ?? '')),
  es.approach.positioning,
  es.approach.premise,
  ...es.approach.questions,
  es.approach.closing,
  es.approach.impactIntro,
  ...es.approach.impactLevels.map((l) => joined(l.title, l.text)),
  es.approach.synthesis,
];

describe('fidelidad del copy en español con contenido-cliente.md', () => {
  it.each(clientTexts.map((t) => [t.slice(0, 50), t]))('"%s…" es literal', (_label, text) => {
    expect(source).toContain(normalize(text));
  });
});
