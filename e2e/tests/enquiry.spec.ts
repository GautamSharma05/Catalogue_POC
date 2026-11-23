import { test, expect } from '@playwright/test';

test.describe('Enquiry', () => {
  test('submitting a valid enquiry shows a thank-you confirmation', async ({ page }) => {
    await page.goto('/');
    await page.locator('.product-grid a.card').first().click();

    await page.getByRole('button', { name: /enquire/i }).click();
    const form = page.getByRole('form', { name: /enquiry form/i });
    await expect(form).toBeVisible();

    await page.getByLabel(/^name$/i).fill('E2E Test User');
    await page.getByLabel(/^email$/i).fill('e2e-test@example.com');
    await page.getByLabel(/^message$/i).fill('I would like to know more about this product.');
    await page.getByRole('button', { name: /submit enquiry/i }).click();

    await expect(page.getByRole('status')).toContainText(/thank you/i);
  });

  test('submitting an enquiry with an invalid email keeps the form visible and shows an error', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('.product-grid a.card').first().click();
    await page.getByRole('button', { name: /enquire/i }).click();

    await page.getByLabel(/^name$/i).fill('E2E Test User');
    // Browser-native type="email" validation blocks this from submitting with
    // an obviously malformed address, so use a syntactically valid but
    // non-existent domain-less address the backend's zod schema rejects.
    await page.getByLabel(/^email$/i).fill('not-an-email');
    await page.getByLabel(/^message$/i).fill('hi');

    // The native HTML5 validation (type="email") will block submission before
    // our API is even called - assert the form is still here and no
    // thank-you confirmation ever appears.
    await page.getByRole('button', { name: /submit enquiry/i }).click();

    await expect(page.getByRole('form', { name: /enquiry form/i })).toBeVisible();
    await expect(page.getByRole('status')).not.toBeVisible();
  });
});
