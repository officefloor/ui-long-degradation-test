import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An approval covers any grand total up to the one approved: a draft whose total goes down after
// approval stays approved, and only one that goes above the approved total needs approval again. An
// approval still lapses after its time (30 days, 90 for KEY clients, 7 for NEW ones).
test.describe('an approval covers a lower total', () => {
  test('an approval covers a lower total but not a higher one', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, approvalLimit: 1000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-06-01', dueDate: '2026-06-30',
          approvedTotal: 1430, approvedOn: '2026-06-02',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1200 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 100 },
          ] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-05-01', dueDate: '2026-06-30',
          approvedTotal: 1320, approvedOn: '2026-05-08',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    // taking the travel off brings it to 1,320.00, under the 1,430.00 approved: still approved
    await page.getByTestId('line-row-2').getByTestId('line-remove').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,320.00');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    // 150.00 of support takes it to 1,485.00, over what was approved
    await page.getByTestId('line-form-description').fill('Support');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('150');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total=1485.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    // an approval still lapses after 30 days, whatever the total
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
  });
});
