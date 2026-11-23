import { test, expect } from '@playwright/test';

test.describe('Product detail', () => {
  test('visiting an unknown product id shows a not-found state', async ({ page }) => {
    await page.goto('/products/999999999');

    await expect(page.getByRole('alert')).toHaveText(/product not found/i);
  });

  test('visiting a known product id shows its title, price, and description', async ({ page }) => {
    // Fake Store API id 1 is a fixed demo-catalogue item; stable across runs.
    await page.goto('/products/1');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.pdp__price')).toContainText('$');
    await expect(page.locator('.pdp__desc')).not.toBeEmpty();
  });
});
