import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A billings target is set and shown on the home screen.
test.describe('budget target', () => {
  test('shows the billings target', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({ settings: { billingTarget: 10000 } });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('target-value')).toHaveText('$10,000.00');
  });
});
