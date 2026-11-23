import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('shows exactly 5 top-rated products and each links to a product page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /top rated products/i })).toBeVisible();

    const tiles = page.locator('.product-grid a.card');
    await expect(tiles).toHaveCount(5);
  });

  test('clicking a featured product navigates to its detail page', async ({ page }) => {
    await page.goto('/');

    const firstTile = page.locator('.product-grid a.card').first();
    const title = await firstTile.locator('.card__title').innerText();
    await firstTile.click();

    await expect(page).toHaveURL(/\/products\/\d+/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByRole('button', { name: /enquire/i })).toBeVisible();
  });
});
