import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice written off by hand counts in the client's risk score as if it had been paid on the
// day it was written off (so as late as that was).
test.describe('write-offs and the risk score', () => {
  test('a written-off invoice counts as paid very late', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2025-12-01', dueDate: '2025-12-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          writtenOffOn: '2026-03-12',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 300 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 200 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-01-02', allocations: [{ invoiceId: 1, amount: 100 }] },
      ],
    });
    await page.goto('/');

    // paid 2 days late, then invoice 2 written off on 2026-03-12, 40 days late: 2, then 0.5 x 40 + 0.5 x 2
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('21.0');
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('HIGH');
    // HIGH: the draft needs approval
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
  });
});
