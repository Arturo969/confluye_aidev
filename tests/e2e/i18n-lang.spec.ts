import { expect, test } from '@playwright/test';

test('la portada en español declara lang="es"', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('la portada en inglés declara lang="en"', async ({ page }) => {
  await page.goto('./en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
