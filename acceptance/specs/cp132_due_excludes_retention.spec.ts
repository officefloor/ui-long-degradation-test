import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Retention that has not been released is not owed yet — not on the invoice, and not anywhere the
// user checks what a client owes: the client's statement, their aging, and the home-screen totals.
// Once the retention is released it counts as owed again.
test.describe('due excludes retention', () => {
  test('unreleased retention is not part of the amount due', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', retentionPct: 10, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$1,000.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$900.00');
  });

  test('what a client owes leaves out unreleased retention everywhere until it is released', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        // 1,000 with 10% (100) held back, and a plain 200; both a few days past due (current).
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-20', retentionPct: 10, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }] },
        { id: 2, projectId: 1, status: 'SENT', dueDate: '2026-02-20', lineItems: [{ id: 2, description: 'Extra', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    // Owed now: 900 + 200 = 1,100 — on the home screen, the client's aging and their statement.
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$1,100.00');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('aging-current')).toHaveText('$1,100.00');
    await page.getByTestId('client-statement-open').click();
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$1,100.00');

    // Release the retention: the 100 is owed again.
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();
    await page.getByTestId('invoice-retention-release').click();
    await expect(page.getByTestId('invoice-retention')).toHaveText('$0.00');

    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$1,200.00');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('aging-current')).toHaveText('$1,200.00');
  });
});
