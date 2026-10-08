import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): the home screen shows how many new clients were taken on this month.
test.describe('dashboard new clients', () => {
  test('counts clients created in the current month', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-15',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@ex.example', createdDate: '2026-02-02' },
        { id: 2, name: 'Globex', email: 'b@ex.example', createdDate: '2026-02-09' },
        { id: 3, name: 'Initech', email: 'c@ex.example', createdDate: '2026-01-10' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-new-clients')).toHaveText('2');
  });
});
