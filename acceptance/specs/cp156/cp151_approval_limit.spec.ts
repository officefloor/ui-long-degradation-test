import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp156 (mutates: [151]): an approval is now for the exact total, so removing the
// support line again (5,610.00 back to 5,280.00) needs a third approval before the invoice can be
// sent. Carries both tests.
// A draft whose grand total (before any withholding) is over the workspace approval limit
// (settings.approvalLimit, in US dollars converted to the client's currency at the invoice's date
// rate, rounded down) needs approval: the panel shows its approval ("Not needed", "Needs approval"
// or "Approved"), sending it is refused until it is approved, and the Approve button approves it,
// writing INVOICE_APPROVED id=<id> total=<grand total>. Approving an invoice that needs no approval
// is refused. Approving records the approved total and the day (invoices[].approvedTotal,
// approvedOn); any change to the grand total afterwards, up or down, needs approval again, and an
// approval lapses 30 days after it was given. Credit notes never need approval.
test.describe('approval over a limit', () => {
  test('an invoice over the approval limit must be approved before it is sent', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, approvalLimit: 5000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 4800 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 4,800.00 + 10% tax = 5,280.00, over the 5,000.00 limit
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$5,280.00');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await page.getByTestId('invoice-approve').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total=5280.00');
    // a line that takes the total above what was approved needs approval again
    await page.getByTestId('line-form-description').fill('Support');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('150');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$5,610.00'); // 5,280.00 + 330.00
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total=5610.00');
    await page.getByTestId('line-row-3').getByTestId('line-remove').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$5,280.00');
    // removing it again changes the total: an approval is for the exact amount, so it needs approval again
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_APPROVED'))).toEqual([
      'INVOICE_APPROVED id=1 total=5280.00',
      'INVOICE_APPROVED id=1 total=5610.00',
      'INVOICE_APPROVED id=1 total=5280.00',
    ]);
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number=INV-0000018 total=5280.00');
    // within the limit no approval is needed, and none can be given
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-approve').click();
    await expect(page.getByTestId('invoice-approve-error')).toBeVisible();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });

  test("converts the limit to the client's currency", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, approvalLimit: 5000, usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' }],
      invoices: [
        { id: 3, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 4132.23 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 4132.24 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    // 5,000.00 US dollars / 1.10 = 4,545.4545, down to €4,545.45: a total of exactly that is not over it
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('€4,545.45'); // 4,132.23 + 413.22
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    // one cent more is
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('€4,545.46');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // a 1% discount brings it back within the limit: 4,090.92 + 409.09
    await page.getByTestId('discount-form-pct').fill('1');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('€4,500.01');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
  });
});
