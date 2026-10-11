import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Generate copies a recurring invoice's period lines as adjusted by its adjustment notes: a change
// of quantity carries into the next period, a line taken off by a credit note is not copied, and a
// line added by a debit note with a service period is copied like the invoice's own. An invoice
// that was generated from another (invoices[].recurringFrom) is that one's next period, so the
// earlier invoice can't generate again; the plan still ends at its end date
// (invoices[].recurUntil).
test.describe('generating from an adjusted invoice', () => {
  test('generating from an adjusted invoice copies its lines as adjusted', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 9, clientId: 1, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-05-31', recurring: true,
          lineItems: [
            { id: 1, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-05-01', periodEnd: '2026-05-31' },
          ] },
        { id: 10, clientId: 1, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-06-30',
          recurring: true, recurringFrom: 9, recurUntil: '2026-12-31',
          lineItems: [
            { id: 2, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-06-01', periodEnd: '2026-06-30' },
            { id: 3, description: 'Licences', qty: 10, unitPrice: 60, periodStart: '2026-06-01', periodEnd: '2026-06-30' },
            { id: 4, description: 'Setup', qty: 1, unitPrice: 120 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // invoice 9 already generated June's invoice 10
    await page.getByTestId('invoice-row-9').click();
    await page.getByTestId('invoice-generate').click();
    await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
    await page.getByTestId('invoice-row-10').click();
    await page.getByTestId('line-row-3').getByTestId('line-edit').click();
    await page.getByTestId('line-form-qty').fill('12');
    await page.getByTestId('line-form-submit').click();
    // two more licences for June: 120.00 a month for 30 days, 120 x 12 / 365 x 30 = 118.36, plus tax
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=11 number=ADJ-0000117 invoice=10 total=130.20');
    await page.getByTestId('line-row-2').getByTestId('line-remove').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=12 number=ADJ-0000125 invoice=10 total=-488.22');
    await page.getByTestId('invoice-generate').click();
    // July: 12 licences and no support plan, as adjusted; the one-off setup is not copied.
    // 720 x 12 / 365 x 31 = 733.81, plus tax; sent at once
    await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from=INV-0000109 to=INV-0000133');
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=13 number=INV-0000133 total=807.19');
    await page.getByTestId('invoice-row-13').click();
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(1);
    await expect(page.getByTestId('line-row-7').getByTestId('line-qty')).toHaveText('12');
    await expect(page.getByTestId('line-row-7').getByTestId('line-period')).toHaveText('2026-07-01 to 2026-07-31');
  });
});
