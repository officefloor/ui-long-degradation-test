import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Amounts in dispute (whole invoices, lines or milestones) still count in the client's balance, but
// not against their credit limit: what is available, the check when sending and the automatic hold
// all use the balance less the amounts in dispute.
test.describe('disputes and the credit limit', () => {
  test('amounts in dispute do not count against the credit limit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', creditLimit: 1000 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          disputedOn: '2026-03-05',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 800 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 150 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    // owed 950.00, but the 800.00 in dispute does not count: 850.00 of the 1,000.00 is available
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$950.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('$850.00');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    // 1,450.00 owed, 650.00 of it counted: not over the limit, so not on hold
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('$350.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('Active');
  });
});
