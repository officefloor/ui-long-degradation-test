import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a client's preferred language is recorded and shown.
test.describe('client language', () => {
  test('shows a client preferred language', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Globex', email: 'ac@globex.example', language: 'French' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-language')).toHaveText('French');
  });
});
