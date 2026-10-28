import { describe, expect, it } from 'vitest';
import { siteMode } from '../../src/lib/config/site-env';

describe('siteMode', () => {
  it('solo producción es indexable y no muestra el banner de prueba', () => {
    expect(siteMode('production')).toEqual({ indexable: true, showPreviewBanner: false });
  });

  it.each(['preview', 'development'] as const)('%s no se indexa y muestra el banner', (env) => {
    expect(siteMode(env)).toEqual({ indexable: false, showPreviewBanner: true });
  });

  it('sin valor falla del lado seguro (no indexable)', () => {
    expect(siteMode(undefined).indexable).toBe(false);
  });
});
