import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a client can be flagged a key account, shown with a marker; others
// have none.
test.describe('key account flag', () => {
  test('marks key accounts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', keyAccount: true },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    await expect(page.getByTestId('client-row-1').getByTestId('client-key-account')).toBeVisible();
    await expect(page.getByTestId('client-row-2').getByTestId('client-key-account')).toHaveCount(0);
  });
});
