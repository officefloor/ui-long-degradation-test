import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each line of a sent invoice has a Credit button: it starts a draft credit note for the invoice
// (or adds to the one already in draft) with a copy of the line, its quantity, price, discount, tax
// rate and exemption, marked as crediting that line (lineItems[].creditOfLine). A credit note that
// would credit more of a line than was invoiced, counting issued credit notes, is refused when it
// is issued.
test.describe('credit a line', () => {
  test("credits one of an invoice's lines", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 9, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 2, description: 'Design', qty: 2, unitPrice: 45, discountPct: 10 },
            { id: 3, description: 'Hosting', qty: 1, unitPrice: 20, taxExempt: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-9').click();
    await page.getByTestId('line-row-2').getByTestId('line-credit').click();
    // a draft credit note (invoice 10) with a copy of the line: 2 x 45.00 less its 10% discount, taxed 10%
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('CN-0000109');
    await expect(page.getByTestId('line-row-4').getByTestId('line-description')).toHaveText('Design');
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$81.00'); // 90.00 - 9.00
    await expect(page.getByTestId('invoice-tax')).toHaveText('$8.10');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$89.10');
  });

  test('cannot credit more of a line than was invoiced', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 9, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 2, description: 'Design', qty: 2, unitPrice: 45 },
            { id: 3, description: 'Hosting', qty: 1, unitPrice: 20 },
          ] },
        { id: 10, clientId: 1, status: 'SENT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 9,
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 45, creditOfLine: 2 }] },
        { id: 11, clientId: 1, status: 'DRAFT', issueDate: '2026-03-06', dueDate: '2026-04-30', creditOf: 9,
          lineItems: [{ id: 5, description: 'Design', qty: 2, unitPrice: 45, creditOfLine: 2 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 1 of the 2 Design lines is already credited, so 2 more is too many
    await page.getByTestId('invoice-row-11').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await page.getByTestId('invoice-row-9').click();
    await expect(page.getByTestId('invoice-credited')).toHaveText('$49.50'); // 45.00 + 4.50 tax
  });
});
