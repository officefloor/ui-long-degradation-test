import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A region's legal maximum interest rate caps only the usual late interest rate (the client's own,
// else the workspace's); the 3 points for a high-risk client and the 2 points after a final notice
// are added on top of the capped rate.
test.describe('the regional cap and the additions', () => {
  test('additions for risk and dunning go on top of the capped rate', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12, regionMaxInterest: { NY: 10 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'NY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-01',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-01',
          reminders: ['2026-05-11', '2026-05-25', '2026-06-01'],
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 110.4, date: '2026-04-20',
          allocations: [{ invoiceId: 1, amount: 110.4 }] },
      ],
    });
    await page.goto('/');

    // Acme paid its last invoice, with its interest, 20 days late: HIGH, so no grace and 3 points more
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('HIGH');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // New York caps the usual 12% at 10%, then the 3 points: 13% on 1,100.00 from 2026-05-01, 40 days
    await expect(page.getByTestId('invoice-interest')).toHaveText('$16.00');
    // Globex: 10% from the end of grace, 12% from its final notice on 2026-06-01
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$10.66');
  });
});
