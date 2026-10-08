import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An aging report across all clients: how much is current, 30-60, and over 60 days overdue.
test.describe('aging report', () => {
  test('totals outstanding into age buckets across clients', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@ex.example' },
        { id: 2, name: 'Globex', email: 'b@ex.example' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-25', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 2, status: 'SENT', dueDate: '2026-01-20', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
        { id: 3, projectId: 2, status: 'SENT', dueDate: '2025-12-01', lineItems: [{ id: 3, description: 'z', qty: 1, unitPrice: 300 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('aging-report-open').click();

    await expect(page.getByTestId('aging-report-current')).toHaveText('$100.00');
    await expect(page.getByTestId('aging-report-30-60')).toHaveText('$200.00');
    await expect(page.getByTestId('aging-report-60-plus')).toHaveText('$300.00');
  });
});
