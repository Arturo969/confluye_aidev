import type { APIRoute } from 'astro';
import { SITE_ENV } from 'astro:env/server';
import { siteMode } from '../lib/config/site-env';

// Fuera de producción no se rastrea nada (SR-05). El sitemap se añade en T-015.
export const GET: APIRoute = () => {
  const rule = siteMode(SITE_ENV).indexable ? 'Allow: /' : 'Disallow: /';
  return new Response(`User-agent: *\n${rule}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
