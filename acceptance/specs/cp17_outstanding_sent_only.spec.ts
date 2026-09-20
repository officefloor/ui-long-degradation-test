import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The money owed on the home screen now counts only invoices that have been SENT (not drafts, not
// paid). Drafts are excluded from the outstanding figure.
test.describe('outstanding counts sent invoices only', () => {
  test('the outstanding total excludes drafts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'SENT' },
        { id: 2, projectId: 1, amount: 50, status: 'DRAFT' },
        { id: 3, projectId: 1, amount: 200, status: 'SENT' },
        { id: 4, projectId: 1, amount: 30, status: 'PAID' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    // 100 + 200 sent-and-unpaid; the 50 draft and 30 paid are excluded.
    await expect(page.getByTestId('dashboard-outstanding-total')).toHaveText('$300.00');
  });
});
