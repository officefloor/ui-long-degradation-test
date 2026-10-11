import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Sending an invoice keeps what it was sent with: its grand total and tax (invoices[].sentTotal,
// sentTax). From then on the invoice is worth exactly that, whatever prices, rates or the client's
// details later say: its grand total, tax, amount before tax and everything worked out from them
// (withholding, amount due, late interest, the client's balance) use the figures it was sent with.
// The panel shows the sent total, and, only when today's rules would give a different grand total,
// that total as the current total. A sent invoice with no recorded figures is worth what its lines
// work out to.
test.describe('a sent invoice keeps what it was sent with', () => {
  test('a sent invoice keeps the total it was sent with', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875 } },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY', withholdingPct: 10 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-30',
          sentTotal: 1087.5, sentTax: 87.5,
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-06-01', dueDate: '2026-06-30',
          lineItems: [{ id: 2, description: 'Support', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // sent at 8.75%: 1,000.00 + 87.50; New York's rate is 8.875% now, which would make it 1,088.75
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,087.50');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$87.50');
    await expect(page.getByTestId('invoice-sent-total')).toHaveText('$1,087.50');
    await expect(page.getByTestId('invoice-current-total')).toHaveText('$1,088.75');
    // 10% of the 1,000.00 before tax is withheld: the client owes 987.50
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$987.50');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$987.50');
    await page.getByTestId('payment-form-amount').fill('987.50');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=987.50');
    // a draft is priced at today's 8.875%: 500.00 + 44.375 -> 44.38; sending keeps that
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$544.38');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-sent-total')).toHaveText('$544.38');
    await expect(page.getByTestId('invoice-current-total')).toHaveCount(0);
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=2 number=INV-0000026 total=544.38');
  });

  test("reopening a sent invoice lets it be sent again at today's figures", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875 } },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-30', sentTotal: 545,
          sentTax: 45,
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    // sent at 9%: 545.00, where today's 8.875% would give 544.38
    await expect(page.getByTestId('invoice-current-total')).toHaveText('$544.38');
    await page.getByTestId('line-form-description').fill('Extra pages');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('100');
    await page.getByTestId('line-form-submit').click();
    // changing it reopens it as a draft, priced and taxed today: 600.00 + 53.25
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$653.25');
    await expect(page.getByTestId('invoice-sent-total')).toHaveCount(0);
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-sent-total')).toHaveText('$653.25');
    await expect(page.getByTestId('invoice-current-total')).toHaveCount(0);
  });
});
