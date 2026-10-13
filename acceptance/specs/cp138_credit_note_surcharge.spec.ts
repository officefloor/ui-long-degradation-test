import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A credit note against an invoice with a surcharge carries the same surcharge percentage on what
// it credits (rounded down to the cent, taxed like the original's), so the surcharge is given back
// in proportion. A credit note never gets a minimum charge.
test.describe('credit notes and surcharges', () => {
  test('a credit note gives back the surcharge on what it credits', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, minimumCharge: 50 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          surchargePct: 10,
          lineItems: [
            { id: 1, description: 'Design', qty: 4, unitPrice: 50 },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 30 },
          ] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 1,
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 50, creditOfLine: 1 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // crediting 50.00 of design: 10% surcharge on it is 5.00, and 8.875% on 55.00 is 4.88125
    await expect(page.getByTestId('invoice-surcharge')).toHaveText('$5.00');
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$59.88');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number=CN-0000026 invoice=1 total=59.88');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    // 230.00 + 23.00 + 8.875% = 275.45; less the 59.88 credited
    await expect(page.getByTestId('invoice-credited')).toHaveText('$59.88');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$215.57');
  });
});
