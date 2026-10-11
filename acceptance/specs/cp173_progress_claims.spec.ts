import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Next claim on a sent invoice with percent-complete lines creates the next claim: a draft for the
// same client, dated today, with a copy of each percent-complete line (invoices[].claimFrom records
// where it came from) whose billed percentage (lineItems[].billedPct, shown as e.g. "40%") is that
// line's percentage so far, writing PROGRESS_CLAIM from=<number> to=<new number>. A claimed line's
// amount is its new percentage of its full amount less its billed percentage of it, each rounded
// half up to the cent; its percentage can't be set to less than it has billed, nor over 100. Other
// lines are not copied; a draft, an invoice with no percent-complete line or one already claimed
// from is refused.
test.describe('progress claims', () => {
  test('claims the progress made since the last invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-10', dueDate: '2026-03-31',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 987.65, percentComplete: 15 },
            { id: 2, description: 'Design', qty: 2, unitPrice: 3000, percentComplete: 40 },
            { id: 3, description: 'Setup', qty: 1, unitPrice: 200 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-next-claim').click();
    await expect.poll(() => auditLines()).toContain('PROGRESS_CLAIM from=INV-0000018 to=INV-0000026');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    // the progress lines only, billed so far at 15% and 40%: nothing more to bill yet
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('line-row-4').getByTestId('line-billed-pct')).toHaveText('15%');
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$0.00');
    await page.getByTestId('line-row-4').getByTestId('line-edit').click();
    await page.getByTestId('line-form-percent').fill('45');
    await page.getByTestId('line-form-submit').click();
    // 45% of 987.65 = 444.44 less the 148.15 already billed at 15% = 296.29 (30% of it would be 296.30)
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$296.29');
    await page.getByTestId('line-row-5').getByTestId('line-edit').click();
    await page.getByTestId('line-form-percent').fill('70');
    await page.getByTestId('line-form-submit').click();
    // 70% of 6,000.00 less the 40% billed: 4,200.00 - 2,400.00
    await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('$1,800.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$2,305.92');
    // progress can't go backwards
    await page.getByTestId('line-row-5').getByTestId('line-edit').click();
    await page.getByTestId('line-form-percent').fill('30');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('$1,800.00');
    // each invoice is claimed from once
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-next-claim').click();
    await expect(page.getByTestId('invoice-next-claim-error')).toBeVisible();
  });
});
