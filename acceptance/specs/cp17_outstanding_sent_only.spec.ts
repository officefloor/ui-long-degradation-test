import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The money owed on the home screen counts only invoices that have been SENT (not drafts, not
// paid). What is sitting in drafts is shown as its own figure, so the user can see what is still
// to be sent.
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
        { id: 5, projectId: 1, amount: 25, status: 'DRAFT' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    // 100 + 200 sent-and-unpaid; the drafts and the 30 paid are excluded.
    await expect(page.getByTestId('dashboard-outstanding-total')).toHaveText('$300.00');
    // The two drafts, 50 + 25, waiting to be sent.
    await expect(page.getByTestId('dashboard-drafts-total')).toHaveText('$75.00');
  });
});
