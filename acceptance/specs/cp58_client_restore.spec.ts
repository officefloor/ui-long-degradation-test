import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client that was tucked away (archived) can be brought back so they return to the main list.
test.describe('restore client', () => {
  test('restores an archived client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Old Client', email: 'old@ex.example', archived: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(1);

    await page.getByTestId('clients-show-archived').click();
    await page.getByTestId('client-restore-2').click();

    await page.getByTestId('clients-show-archived').click(); // back to default view
    await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Old Client');
  });
});
