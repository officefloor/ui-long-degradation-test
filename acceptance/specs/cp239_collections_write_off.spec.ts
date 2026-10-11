import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice still owing 30 days after its collections notice went out is written off that day,
// exactly as a write-off by hand: status Written off, the amount written off shown, out of the
// balance and overdue amount, no more interest, and counted in the risk score as paid on the day it
// was written off.
test.describe('written off after collections', () => {
  test('an invoice is written off 30 days after its collections notice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          reminders: ['2026-03-11', '2026-03-25', '2026-04-15', '2026-05-01'],
          lineItems: [{ id: 1, description: 'Audit', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-06-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          reminders: ['2026-03-11', '2026-03-25', '2026-04-15', '2026-05-20'],
          lineItems: [{ id: 3, description: 'Audit', qty: 1, unitPrice: 400 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 4, description: 'Support', qty: 1, unitPrice: 80 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // collections notice on 2026-05-01: written off on 2026-05-31
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Written off');
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$440.00');
    // out of the balance, and no longer an unpaid final notice holding the client
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$220.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('Active');
    // counted as paid on 2026-05-31, 91 days late: HIGH
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-score')).toHaveText('91.0');
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('HIGH');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 2 approvals');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    // Globex's collections notice is only 21 days old
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-2').getByTestId('client-status')).toHaveText('On hold');
  });
});
