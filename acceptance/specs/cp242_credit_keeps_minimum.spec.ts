import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A credit adjustment note never takes its invoice below its minimum charge: when its lines, after
// the invoice's discount and with its surcharge, would leave the invoice (with its earlier notes)
// under the minimum, the part that would is kept back on the note as a minimum charge, taxed at the
// standard rate on its own (rounded half up), and the note credits only the rest.
test.describe('credit notes and the minimum charge', () => {
  test('a credit note never takes an invoice below its minimum charge', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', minimumCharge: 300 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [
            { id: 1, description: 'Design', qty: 1, unitPrice: 250 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 100 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 350.00 of lines, over the 300.00 minimum
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$0.00');
    await page.getByTestId('line-row-2').getByTestId('line-remove').click();
    // taking the travel off would leave 250.00: 50.00 of the credit is kept back as the minimum charge,
    // so the note credits 50.00 + 5.00 tax
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number=ADJ-0000026 invoice=1 total=-55.00');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$50.00');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$330.00'); // 385.00 - 55.00
    await page.getByTestId('payment-form-amount').fill('330');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
  });

  test('above the minimum the whole line is credited', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example', minimumCharge: 300 }],
      invoices: [
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [
            { id: 3, description: 'Design', qty: 1, unitPrice: 450 },
            { id: 4, description: 'Travel', qty: 1, unitPrice: 100 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('line-row-4').getByTestId('line-remove').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number=ADJ-0000042 invoice=3 total=-110.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$495.00');
  });
});
