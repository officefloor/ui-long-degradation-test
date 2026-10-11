import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp176 (mutates: [155, 157, 165, 175]): service periods are now charged by the day at
// 12/365 of the monthly price, so January 20-31 and the 28 days of February cost less than before.
// Carries both tests.
// An invoice can be recurring (invoices[].recurring, the panel's Recurring box). Generate on a sent
// recurring invoice creates the next period's draft for the same client, dated today with the usual
// due date: a copy of each line that has a service period, with the period moved to the whole
// calendar month after the latest period end on the invoice (lines without a period are one-offs
// and are not copied), and the invoice's percentage discount and surcharge; the new draft is
// recurring and records where it came from (invoices[].recurringFrom). New ids continue from the
// highest. Generating writes INVOICE_GENERATED from=<number> to=<new number>. It is refused for a
// draft, an invoice that is not recurring or has no service period, or one that has already
// generated its next period. The new draft is priced, taxed and checked for approval like any
// other.
test.describe('recurring invoices', () => {
  test('generates the next period of a recurring invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-03',
      settings: { taxRate: 10, approvalLimit: 1000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-20', dueDate: '2026-02-28', discountPct: 5,
          recurring: true,
          lineItems: [
            { id: 1, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-01-20', periodEnd: '2026-01-31' },
            { id: 2, description: 'Licences', qty: 10, unitPrice: 60, periodStart: '2026-01-20', periodEnd: '2026-01-31' },
            { id: 3, description: 'Setup', qty: 1, unitPrice: 120 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // January 20-31 of 450.00 and 600.00 a month: $177.53 and $236.71, plus the one-off setup
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$558.28');
    await page.getByTestId('invoice-generate').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from=INV-0000018 to=INV-0000026');
    // the new draft, dated today, bills all of February for the recurring lines only, with the 5% discount
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-issue')).toHaveText('2026-02-03');
    await expect(page.getByTestId('line-row-4').getByTestId('line-period')).toHaveText('2026-02-01 to 2026-02-28');
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$414.25');
    await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('$552.33');
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('invoice-discount')).toHaveText('$48.32');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,010.09');
    // a whole month takes it over the 1,000.00 approval limit
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // each invoice generates its next period once, and only once it has been sent
    await page.getByTestId('invoice-generate').click();
    await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-generate').click();
    await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
    await expect(page.getByTestId(/^invoice-row-\d+$/)).toHaveCount(2);
  });

  test('marks an invoice as recurring', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-03',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-01-02', dueDate: '2026-01-31',
          lineItems: [
            { id: 7, description: 'Hosting', qty: 1, unitPrice: 200, periodStart: '2026-01-01', periodEnd: '2026-01-31' },
          ] },
        { id: 6, clientId: 1, status: 'SENT', issueDate: '2026-01-02', dueDate: '2026-01-31', recurring: true,
          lineItems: [{ id: 8, description: 'Design', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // not recurring yet: nothing to generate
    await page.getByTestId('invoice-row-5').click();
    await page.getByTestId('invoice-generate').click();
    await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
    await page.getByTestId('invoice-recurring').check();
    await page.getByTestId('invoice-generate').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from=INV-0000059 to=INV-0000075');
    await page.getByTestId('invoice-row-7').click();
    await expect(page.getByTestId('line-row-9').getByTestId('line-period')).toHaveText('2026-02-01 to 2026-02-28');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$202.52'); // 28 days at 200 x 12 / 365 = 184.11, + 10%
    // a recurring invoice with no service period has nothing to repeat
    await page.getByTestId('invoice-row-6').click();
    await page.getByTestId('invoice-generate').click();
    await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
  });
});
