import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A disputed invoice shows its own distinct status and still counts as owed, but is kept out of the
// normal overdue chase: the home screen's overdue count, overdue amount and overdue age buckets
// leave it out.
test.describe('disputed status', () => {
  test('a disputed invoice shows a distinct status and still counts as owed', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', disputed: true, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('DISPUTED');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$100.00');
  });

  test('a disputed invoice is kept out of the overdue figures', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        // 40 days overdue but disputed: out of the overdue chase.
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-01-20', disputed: true, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] },
        // 9 days overdue, not disputed.
        { id: 2, projectId: 1, status: 'SENT', dueDate: '2026-02-20', lineItems: [{ id: 2, description: 'Extra', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-overdue-count')).toHaveText('1');
    await expect(page.getByTestId('dashboard-overdue-amount')).toHaveText('$50.00');
    await expect(page.getByTestId('dashboard-overdue-0-30')).toHaveText('$50.00');
    await expect(page.getByTestId('dashboard-overdue-31-60')).toHaveText('$0.00');

    // It is still owed.
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('DISPUTED');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$100.00');
  });
});
