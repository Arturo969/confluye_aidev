import { expect, test } from '@playwright/test';

// El build local no es de producción: debe comportarse como la preview (SR-05).
for (const { path, text } of [
  { path: './', text: 'Versión de prueba' },
  { path: './en/', text: 'Preview version' },
]) {
  test(`${path} no es indexable y muestra el banner de prueba`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    const banner = page.getByRole('complementary', { name: /prueba|preview/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(text);
  });
}

test('robots.txt bloquea el rastreo fuera de producción', async ({ request, baseURL }) => {
  const res = await request.get(new URL('robots.txt', baseURL).toString());
  expect(res.ok()).toBe(true);
  expect(await res.text()).toMatch(/Disallow: \/\s*$/m);
});
