import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Setting a recurring invoice's end date before the end of a period it has already billed issues a
// credit note, dated today, for the days after the end date: each line with a service period is
// credited for the part of its period after the end date, charged by the day and taxed like the
// original (lines without a period are not credited). It is issued like any credit note
// (CREDIT_NOTE_ISSUED, any excess held as credit), and the plan ends.
test.describe('ending a plan early', () => {
  test('ending a plan inside a billed period credits the days after it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-02', dueDate: '2026-03-31', recurring: true,
          lineItems: [
            { id: 1, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-03-01', periodEnd: '2026-03-31' },
            { id: 2, description: 'Setup', qty: 1, unitPrice: 120 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-recur-until').fill('2026-03-15');
    await page.getByTestId('invoice-recur-until-submit').click();
    // March was billed in full; 2026-03-16 to 2026-03-31 is credited: 16 days at 450 x 12 / 365 = 236.71,
    // plus 10% tax like the original. The one-off setup is not credited
    await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number=CN-0000026 invoice=1 total=260.38');
    await expect(page.getByTestId('invoice-credited')).toHaveText('$260.38');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$376.11');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('line-row-3').getByTestId('line-period')).toHaveText('2026-03-16 to 2026-03-31');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$236.71');
    // and the plan has ended: nothing more to generate
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-generate').click();
    await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
  });
});
