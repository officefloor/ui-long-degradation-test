import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp224 (mutates: [151, 156]): an approval covers any total up to the one approved
// again, so the 2% discount (1,320.00 down to 1,293.60) leaves invoice 3 approved and it is sent
// without a fresh approval; lapsing after 30 days is unchanged. Carries the test.
// An approval is for the grand total approved (invoices[].approvedTotal) and the day it was given
// (invoices[].approvedOn, recorded by the Approve button): a lower grand total stays approved, a
// higher one needs approval again, and an approval lapses once more than 30 days have passed since
// it was given (approved on 2026-02-08, it is still good on 2026-03-10 but not on 2026-03-11).
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
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    // a 2% discount lowers the total to 1,293.60, within the 1,320.00 approved: still approved
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    await page.getByTestId('discount-form-pct').fill('2');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,293.60');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_APPROVED'))).toEqual([]);
  });
});
