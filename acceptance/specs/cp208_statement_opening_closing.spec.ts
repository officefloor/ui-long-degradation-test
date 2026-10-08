import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A date-range statement reconciles: opening balance plus the movements in the period equals the
// closing balance.
test.describe('statement reconciliation', () => {
  test('opening plus movements equals closing', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-15', lineItems: [{ id: 1, description: 'Prior', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-10', lineItems: [{ id: 2, description: 'In range', qty: 1, unitPrice: 300 }] },
      ],
      payments: [{ id: 1, invoiceId: 1, amount: 50, date: '2026-02-20' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    await page.getByTestId('statement-range-from').fill('2026-02-01');
    await page.getByTestId('statement-range-to').fill('2026-02-28');
    await page.getByTestId('statement-range-apply').click();

    await expect(page.getByTestId('statement-opening-balance')).toHaveText('$100.00');
    await expect(page.getByTestId('statement-movements-total')).toHaveText('$250.00');
    await expect(page.getByTestId('statement-closing-balance')).toHaveText('$350.00');
  });
});
