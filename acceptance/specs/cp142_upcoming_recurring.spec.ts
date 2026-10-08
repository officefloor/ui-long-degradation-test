import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Recurring invoices that are coming up are listed with their next date, soonest first.
test.describe('upcoming recurring invoices', () => {
  test('lists upcoming recurring invoices by next date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-15',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      recurring: [
        { id: 1, projectId: 1, amount: 300, frequency: 'MONTHLY', nextDate: '2026-04-01' },
        { id: 2, projectId: 1, amount: 150, frequency: 'MONTHLY', nextDate: '2026-03-01' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    const rows = page.getByTestId('upcoming-recurring').getByTestId(/^recurring-row-/);
    await expect(rows.nth(0).getByTestId('recurring-next-date')).toHaveText('2026-03-01');
    await expect(rows.nth(1).getByTestId('recurring-next-date')).toHaveText('2026-04-01');
  });
});
