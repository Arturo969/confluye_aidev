export const SITE_ENVS = ['development', 'preview', 'production'] as const;
export type SiteEnv = (typeof SITE_ENVS)[number];

export interface SiteMode {
  indexable: boolean;
  showPreviewBanner: boolean;
}

/** Solo producción se indexa; cualquier otro valor (o ninguno) se trata como preview (SR-05). */
export function siteMode(env: SiteEnv | undefined): SiteMode {
  const production = env === 'production';
  return { indexable: production, showPreviewBanner: !production };
}
