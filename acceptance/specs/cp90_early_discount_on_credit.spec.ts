import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Credit used on an invoice when it is sent counts as an early payment: for a client with an early-
// payment discount, only the amount that settles it early (the grand total minus the early
// discount) is taken from the credit, and if the credit covers it the invoice is settled with the
// early discount (EARLY_DISCOUNT is written).
test.describe('early discount on credit used', () => {
  test('credit used on sending settles early with the discount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', earlyPayPct: 2, earlyPayDays: 10 }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 300 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 500, date: '2026-02-20', allocations: [] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-send').click();
    // sent today, inside the early window: 300.00 less 2% (6.00) is all the credit has to pay
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=294.00');
    await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=1 amount=6.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-early-discount')).toHaveText('$6.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$206.00'); // 500.00 - 294.00
  });
});
