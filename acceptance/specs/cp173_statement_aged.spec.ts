import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The statement shows how the balance breaks down by age — current, 30, 60 and 90 days — against
// the reference date.
test.describe('statement aged balance', () => {
  test('breaks the balance into age bands', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-25', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] }, // current
        { id: 2, projectId: 1, status: 'SENT', dueDate: '2026-01-20', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] }, // 30-60
        { id: 3, projectId: 1, status: 'SENT', dueDate: '2025-12-01', lineItems: [{ id: 3, description: 'C', qty: 1, unitPrice: 300 }] }, // 90+
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('statement-aging-current')).toHaveText('$100.00');
    await expect(page.getByTestId('statement-aging-30-60')).toHaveText('$200.00');
    await expect(page.getByTestId('statement-aging-60-plus')).toHaveText('$300.00');
  });
});
