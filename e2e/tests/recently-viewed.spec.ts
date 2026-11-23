import { test, expect } from '@playwright/test';

test.describe('Recently viewed', () => {
  test('a visited product appears under Recently viewed on the home page after navigating back', async ({
    page,
  }) => {
    await page.goto('/');

    const firstTile = page.locator('.product-grid a.card').first();
    const title = await firstTile.locator('.card__title').innerText();
    await firstTile.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);

    await page.goto('/');

    const recentlyViewedSection = page
      .locator('section.section')
      .filter({ has: page.getByRole('heading', { name: /recently viewed/i }) });
    await expect(recentlyViewedSection).toBeVisible();
    await expect(recentlyViewedSection.locator('.product-grid')).toContainText(title);
  });

  test('recently viewed persists across a full page reload (localStorage), not just client-side navigation', async ({
    page,
  }) => {
    await page.goto('/');
    const firstTile = page.locator('.product-grid a.card').first();
    const title = await firstTile.locator('.card__title').innerText();
    await firstTile.click();

    await page.reload();
    await page.goto('/');

    const recentlyViewedSection = page
      .locator('section.section')
      .filter({ has: page.getByRole('heading', { name: /recently viewed/i }) });
    await expect(recentlyViewedSection).toBeVisible();
    await expect(recentlyViewedSection.locator('.product-grid')).toContainText(title);
  });
});
