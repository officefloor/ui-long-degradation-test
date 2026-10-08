import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): select several clients and apply a tag to all of them at once.
test.describe('bulk tag clients', () => {
  test('tags every selected client', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@acme.example' },
        { id: 2, name: 'Globex', email: 'b@globex.example' },
        { id: 3, name: 'Initech', email: 'c@initech.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    await page.getByTestId('clients-select-1').check();
    await page.getByTestId('clients-select-3').check();
    await page.getByTestId('clients-bulk-tag-input').fill('VIP');
    await page.getByTestId('clients-bulk-tag-apply').click();

    await expect(page.getByTestId('client-tag-1')).toHaveText('VIP');
    await expect(page.getByTestId('client-tag-3')).toHaveText('VIP');
    await expect(page.getByTestId('client-tag-2')).toHaveCount(0);
  });
});
