import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a client can be pinned to the top of the list.
test.describe('pin clients', () => {
  test('pins a client', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@ex.example' },
        { id: 2, name: 'Globex', email: 'b@ex.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-pin-2').click();

    await expect(page.getByTestId('pinned-clients').getByTestId('client-row-2')).toBeVisible();
  });
});
