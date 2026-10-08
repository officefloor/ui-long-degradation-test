import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A setting chooses whether revenue counts when an invoice is sent or when it is paid.
test.describe('recognition basis', () => {
  test('the chosen basis is saved', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({});
    await page.goto('/');
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('settings-recognition-basis').selectOption('paid');
    await page.getByTestId('settings-save').click();

    await page.reload();
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-recognition-basis')).toHaveValue('paid');
  });
});
