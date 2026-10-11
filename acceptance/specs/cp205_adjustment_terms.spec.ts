import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An adjustment note carries its invoice's percentage discount (taken off the note's lines, rounded
// down, and split over them as usual) and its surcharge percentage. Withholding is judged on an
// invoice together with its adjustment notes: the threshold applies to their amounts before tax
// added together (credit notes taken off), a debit note withholds on its own amount before tax
// (WITHHOLDING when it is issued), and the invoice withholds on its own amount before tax less its
// credit notes'.
test.describe("adjustment notes follow the invoice's terms", () => {
  test("an adjustment note carries the invoice's discount and surcharge, and counts towards withholding", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, withholdingThreshold: 1000 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example', withholdingPct: 10 }],
      invoices: [
        { id: 1, clientId: 2, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30', discountPct: 10,
          surchargePct: 2,
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 950 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-1').click();
    // 950.00 - 95.00 + 17.10 surcharge = 872.10 before tax, under the 1,000.00 threshold: nothing withheld
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$959.31');
    await page.getByTestId('line-form-description').fill('Extra build');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('200');
    await page.getByTestId('line-form-submit').click();
    // the note takes the invoice's 10% off (20.00) and its 2% surcharge (3.60), then 10% tax: 201.96
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number=ADJ-0000026 invoice=1 total=201.96');
    // together they are 872.10 + 183.60 = 1,055.70 before tax, so both withhold 10%
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$87.21');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$872.10'); // 959.31 - 87.21
    await expect.poll(() => auditLines()).toContain('WITHHOLDING id=2 amount=18.36');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-surcharge')).toHaveText('$3.60');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$183.60'); // 201.96 - 18.36
    await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('$1,055.70');
    // paying the 183.60 it owes settles the note; the withheld 18.36 is never owed
    await page.getByTestId('payment-form-amount').fill('183.60');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('$872.10');
  });

  test('a credit adjustment gives back its share of what was withheld', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', withholdingPct: 10 }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [
            { id: 3, description: 'Design', qty: 1, unitPrice: 800 },
            { id: 4, description: 'Travel', qty: 1, unitPrice: 200 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    // 1,100.00 less 100.00 withheld
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,000.00');
    await page.getByTestId('line-row-4').getByTestId('line-remove').click();
    // the travel comes off (220.00) and only 10% of the 800.00 left is withheld: 1,100.00 - 80.00 - 220.00
    await expect(page.getByTestId('invoice-adjusted')).toHaveText('-$220.00');
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$80.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$800.00');
  });
});
