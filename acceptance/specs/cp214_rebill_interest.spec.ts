import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Rebilling an invoice that owes late interest carries it: the interest owed (once past any
// threshold) stops and is waived on the old invoice, and the replacement gets a line "Late interest
// <old number>" for that amount, quantity 1, which takes no tax, no share of the invoice discount
// and no surcharge. Writes INTEREST_CARRIED from=<old number> to=<new number> amount=<interest>.
test.describe('a rebill carries late interest', () => {
  test('a rebill carries the late interest owed to the replacement', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 1,100.00 overdue since the end of grace on 2026-05-07: 34 days at 12%
    await expect(page.getByTestId('invoice-interest')).toHaveText('$12.54');
    await page.getByTestId('invoice-rebill').click();
    await expect.poll(() => auditLines()).toContain('INTEREST_CARRIED from=INV-0000018 to=INV-0000034 amount=12.54');
    // the credit note clears the 1,100.00 and the interest stops on the old invoice
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Credited');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    // the replacement bills it as a line of its own, with no tax
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('line-row-4').getByTestId('line-description')).toHaveText('Late interest INV-0000018');
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$12.54');
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,112.54');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,112.54');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$1,112.54');
  });

  test('interest under the threshold is not owed, so nothing is carried', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12, interestThreshold: 20 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example' }],
      invoices: [
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('invoice-rebill').click();
    await page.getByTestId('invoice-row-6').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-6').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(1);
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$990.00');
    expect(auditLines().filter((l) => l.startsWith('INTEREST_CARRIED'))).toEqual([]);
  });
});
