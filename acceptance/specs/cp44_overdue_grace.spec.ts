import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Clients get a week's grace: an invoice becomes Overdue only once today is more than 7 days past
// its due date. The client's overdue amount follows the same rule.
test.describe('overdue grace period', () => {
  test('an invoice is overdue only after a week past its due date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-13',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-12',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 60 }] },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$160.00'); // 100 + 60
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$60.00'); // invoice 2 only
    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Sent');    // 7 days past
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Overdue'); // 8 days past
  });
});
