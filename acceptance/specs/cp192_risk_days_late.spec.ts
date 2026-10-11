import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The payment risk score now uses how late each invoice paid in full was paid: the paid date less
// the due date, 0 when paid by the due date, averaged oldest payment first with a weight of 0.5
// (the first value, then 0.5 x the next + 0.5 x the average so far), to one decimal half up. The
// bands are LOW under 5 days, MEDIUM under 15 and HIGH from 15.
test.describe('risk from days late', () => {
  test('scores how late a client pays', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { taxRate: 0 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2025-10-01', dueDate: '2025-11-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2025-11-01', dueDate: '2025-12-31',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2025-12-01', dueDate: '2026-01-31',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-15',
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 5, clientId: 2, status: 'SENT', issueDate: '2026-01-10', dueDate: '2026-01-31',
          lineItems: [{ id: 5, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2025-11-30', allocations: [{ invoiceId: 1, amount: 100 }] },
        { id: 2, clientId: 1, amount: 100, date: '2026-01-10', allocations: [{ invoiceId: 2, amount: 100 }] },
        { id: 3, clientId: 1, amount: 100, date: '2026-02-04', allocations: [{ invoiceId: 3, amount: 100 }] },
        { id: 4, clientId: 2, amount: 100, date: '2026-01-20', allocations: [{ invoiceId: 4, amount: 100 }] },
        { id: 5, clientId: 2, amount: 100, date: '2026-02-20', allocations: [{ invoiceId: 5, amount: 100 }] },
      ],
    });
    await page.goto('/');

    // Acme took 60, 70 and 65 days to pay (it was HIGH), but paid 0, 10 and 4 days late:
    // 0, then 0.5 x 10 + 0.5 x 0 = 5, then 0.5 x 4 + 0.5 x 5 = 4.5: LOW (under 5)
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('4.5');
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('LOW');
    // Globex paid 5 and 20 days late: 5, then 0.5 x 20 + 0.5 x 5 = 12.5: MEDIUM (under 15)
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-score')).toHaveText('12.5');
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('MEDIUM');
  });
});
