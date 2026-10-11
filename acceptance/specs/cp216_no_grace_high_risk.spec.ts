import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client in the HIGH risk band (judged, for an invoice, on the client's other invoices) gets no
// grace period: their invoices are overdue the day after they fall due, and late interest runs from
// the due date, with everything that follows from being overdue.
test.describe('no grace for high-risk clients', () => {
  test('a high-risk client has no grace period', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-05',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-05',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 110.48, date: '2026-04-20',
          allocations: [{ invoiceId: 1, amount: 110.48 }] },
      ],
    });
    await page.goto('/');

    // Acme paid its last invoice (with 13 days' interest, 0.48) 20 days late: HIGH
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('HIGH');
    await page.getByTestId('client-row-1').click();
    // due 2026-06-05, five days ago: with no grace it is overdue and earns interest from the due date,
    // 1,100.00 x ((1 + 0.15/360)^5 - 1) at 12% + 3 for a HIGH client
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$2.29');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,102.29');
    // Globex has no history: its invoice due the same day is still within its grace week
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    await expect(page.getByTestId('client-row-2').getByTestId('client-overdue')).toHaveText('$0.00');
  });
});
