import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Crediting units of a line priced in tiers gives back its last units first: the credited line is
// priced at the exact charge of the top units of the bands the original line used, rounded to the
// cent, then taxed like the original.
test.describe('crediting tiered lines', () => {
  test('credits tiered units from the top band down', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [
            { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { units: 40, unitPrice: 15 }, { unitPrice: 12 }] },
            { unitType: 'hour', unitPrice: 95 },
          ] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Licences', qty: 60, unitType: 'licence' },
            { id: 2, description: 'Setup', qty: 2, unitType: 'hour' },
          ] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 1,
          lineItems: [{ id: 3, description: 'Licences', qty: 15, unitType: 'licence', creditOfLine: 1 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // the invoice billed units 1-60; crediting 15 gives back units 46-60, the cheapest:
    // 10 x 12.00 + 5 x 15.00 = 195.00 (15 from the first band would be 275.00)
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$195.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$214.50'); // 195.00 + 10%
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number=CN-0000026 invoice=1 total=214.50');
    await page.getByTestId('invoice-row-1').click();
    // 920.00 + 190.00 + 10% = 1,221.00, less the 214.50 credited
    await expect(page.getByTestId('invoice-credited')).toHaveText('$214.50');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,006.50');
  });
});
