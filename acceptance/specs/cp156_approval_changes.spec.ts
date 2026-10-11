import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An approval is for the exact grand total approved (invoices[].approvedTotal) and the day it was
// given (invoices[].approvedOn, recorded by the Approve button): any change to the grand total
// afterwards, up or down, means the invoice needs approval again, and an approval lapses once more
// than 30 days have passed since it was given (approved on 2026-02-08, it is still good on
// 2026-03-10 but not on 2026-03-11).
test.describe('approvals for the exact total', () => {
  test('an approval is for the exact total and lapses after 30 days', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, approvalLimit: 1000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          approvedTotal: 1320, approvedOn: '2026-02-07',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1200 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          approvedTotal: 1320, approvedOn: '2026-02-08',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1200 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          approvedTotal: 1320, approvedOn: '2026-03-02',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // approved on 2026-02-07: 31 days ago, so it has lapsed
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    // approved on 2026-02-08: 30 days ago, still good
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    // a 2% discount lowers the total to 1,293.60, which is not the 1,320.00 approved
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    await page.getByTestId('discount-form-pct').fill('2');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,293.60');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=3 total=1293.60');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });
});
