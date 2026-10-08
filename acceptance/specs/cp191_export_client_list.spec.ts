import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): the client list can be exported to a file.
test.describe('export client list', () => {
  test('confirms the export', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@ex.example' },
        { id: 2, name: 'Globex', email: 'b@ex.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-export-all').click();

    await expect(page.getByTestId('export-confirm')).toHaveText('2');
  });
});
