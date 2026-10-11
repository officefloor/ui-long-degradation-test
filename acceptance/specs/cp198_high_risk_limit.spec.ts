import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A HIGH-risk client's credit limit counts as half of what is set, rounded down to the cent, for
// what is available, the check when sending and the automatic hold.
test.describe('half the credit limit for high risk', () => {
  test("a high-risk client's credit limit counts as half", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', creditLimit: 2000 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', creditLimit: 2000 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 600 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 500 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 600 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-02-20', allocations: [{ invoiceId: 1, amount: 100 }] },
      ],
    });
    await page.goto('/');

    // Acme paid its last invoice 20 days late: HIGH, so its 2,000.00 limit counts as 1,000.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('HIGH');
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('$400.00');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    // 600.00 + 500.00 is over 1,000.00 (though well within 2,000.00): it needs approval
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    // Globex has no history: all of its 2,000.00
    await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('$1,400.00');
  });
});
