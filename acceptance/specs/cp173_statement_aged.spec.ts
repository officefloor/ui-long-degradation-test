import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The statement shows how the balance breaks down by age against the reference date, in four
// bands: current (up to 30 days overdue), 30 to 60 days, 60 to 90 days, and more than 90 days.
test.describe('statement aged balance', () => {
  test('breaks the balance into age bands', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-25', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] }, // 4 days: current
        { id: 2, projectId: 1, status: 'SENT', dueDate: '2026-01-20', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] }, // 40 days: 30-60
        { id: 3, projectId: 1, status: 'SENT', dueDate: '2025-12-16', lineItems: [{ id: 3, description: 'C', qty: 1, unitPrice: 400 }] }, // 75 days: 60-90
        { id: 4, projectId: 1, status: 'SENT', dueDate: '2025-11-20', lineItems: [{ id: 4, description: 'D', qty: 1, unitPrice: 300 }] }, // 101 days: over 90
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('statement-aging-current')).toHaveText('$100.00');
    await expect(page.getByTestId('statement-aging-30-60')).toHaveText('$200.00');
    await expect(page.getByTestId('statement-aging-60-90')).toHaveText('$400.00');
    await expect(page.getByTestId('statement-aging-90-plus')).toHaveText('$300.00');
  });
});
