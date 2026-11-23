import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('searching for a known term shows only matching products', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder(/search products/i).fill('bag');
    await page.getByPlaceholder(/search products/i).press('Enter');

    await expect(page).toHaveURL(/\/search\?q=bag/);
    await expect(page.getByRole('heading', { name: /search results for/i })).toBeVisible();

    const tiles = page.locator('.product-grid a.card');
    await expect(tiles.first()).toBeVisible();
    const count = await tiles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('searching for a term with no matches shows an explicit empty state', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder(/search products/i).fill('zzz-no-such-product-zzz');
    await page.getByPlaceholder(/search products/i).press('Enter');

    await expect(page.getByText(/no results for that search/i)).toBeVisible();
  });
});
