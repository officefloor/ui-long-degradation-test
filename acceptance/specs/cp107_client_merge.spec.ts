import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): two duplicate clients can be merged into one.
test.describe('merge clients', () => {
  test('merges one client into another', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Acme Limited', email: 'billing@acme.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(2);

    await page.getByTestId('client-open-2').click();
    await page.getByTestId('client-merge-into').selectOption('1');
    await page.getByTestId('client-merge-submit').click();

    await page.getByTestId('nav-clients').click();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(1);
  });
});
