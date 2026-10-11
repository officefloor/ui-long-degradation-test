import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client's approved drafts are commitments: what they will add to the balance (grand total less
// withholding) is taken off what is available under the credit limit, and counted when judging
// whether another draft would take the client over it. Sending an approved draft moves it from
// committed to owed.
test.describe('approved drafts and the credit limit', () => {
  test('approved drafts count against the credit limit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', creditLimit: 1000 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 300 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          discountPct: 25, approvedTotal: 375, approvedOn: '2026-03-10',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 500 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 300 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    // 300.00 owed and the approved draft's 375.00 committed: 325.00 of the 1,000.00 is left
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('$325.00');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('$25.00');
    // 600.00 + 375.00 + 50.00 would pass the limit: the small draft now needs approval
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
  });
});
