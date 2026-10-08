import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): clients can be sorted with key accounts first, then by name.
test.describe('sort key accounts first', () => {
  test('lists key accounts before the rest', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Zephyr Co', email: 'z@zephyr.example' },
        { id: 2, name: 'Apex Ltd', email: 'a@apex.example', keyAccount: true },
        { id: 3, name: 'Beacon Inc', email: 'b@beacon.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-sort').selectOption('key-account');

    const rows = page.getByTestId(/^client-row-/);
    await expect(rows.nth(0).getByTestId('client-name')).toHaveText('Apex Ltd');
    await expect(rows.nth(1).getByTestId('client-name')).toHaveText('Beacon Inc');
    await expect(rows.nth(2).getByTestId('client-name')).toHaveText('Zephyr Co');
  });
});
