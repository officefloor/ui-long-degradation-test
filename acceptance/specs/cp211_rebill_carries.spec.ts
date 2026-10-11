import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Rebill moves an invoice's open states to its replacement: an open dispute (the replacement's
// lines matching the disputed lines stay disputed, from the same day; the old invoice's dispute
// closes), its milestones (with the days they were reached) and a recurring plan (the old invoice
// stops recurring). A replacement whose grand total is no more than what the old invoice was sent
// for counts as approved for that total; one for more needs approval like any draft.
test.describe('a rebill carries the invoice with it', () => {
  test('a rebill carries the dispute, the purchase order and the approval', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, approvalLimit: 1000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30', sentTotal: 1332,
          sentTax: 132, poNumber: 'PO-4471', disputedOn: '2026-06-01', approvedTotal: 1332,
          approvedOn: '2026-05-14',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 200, disputed: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$220.00');
    await page.getByTestId('invoice-rebill').click();
    // the replacement: 1,200.00 + 10% = 1,320.00, over the 1,000.00 limit but no more than the
    // 1,332.00 the invoice was approved and sent for, so it is approved already
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,320.00');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    await expect(page.getByTestId('invoice-po')).toHaveText('PO-4471');
    await page.getByTestId('invoice-send').click();
    // the travel line is still in dispute on the replacement (200.00 + 20.00), not on the old invoice
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$220.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Credited');
  });

  test('a replacement for more than was approved needs approval again', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, approvalLimit: 1000, regionTaxRates: { NJ: 12 } },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'NJ' }],
      invoices: [
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30', sentTotal: 1100,
          sentTax: 100, approvedTotal: 1100, approvedOn: '2026-05-14',
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('invoice-rebill').click();
    // New Jersey's 12% makes it 1,120.00, more than the 1,100.00 approved
    await page.getByTestId('invoice-row-6').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,120.00');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
  });
});
