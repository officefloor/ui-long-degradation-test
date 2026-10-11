import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A client can have a yearly price rise (clients[].upliftPct, on the client form). A recurring
// invoice knows when its plan began (invoices[].recurringSince: the first period's start when it is
// first made recurring, kept by the drafts it generates). When Generate makes a period that starts
// on or after the next anniversary of that date, each typed unit price on the copied lines goes up
// by the client's percentage, rounded half up to the cent, and the new draft's plan date moves on a
// year; lines priced from a rate card or the price list keep that price.
test.describe('yearly price rise', () => {
  test('raises recurring prices on each anniversary', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-02',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', upliftPct: 4 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-02', dueDate: '2026-02-28', recurring: true,
          recurringSince: '2025-03-01',
          lineItems: [
            { id: 1, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-02-01', periodEnd: '2026-02-28' },
            { id: 2, description: 'Licences', qty: 3, unitPrice: 33.33, periodStart: '2026-02-01', periodEnd: '2026-02-28' },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-generate').click();
    // March starts a year after the plan began on 2025-03-01, so the client's 4% rise applies to each unit
    // price, rounded half up: 450.00 -> 468.00, 33.33 -> 34.6632 -> 34.66
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('line-row-3').getByTestId('line-unit-price')).toHaveText('$468.00');
    await expect(page.getByTestId('line-row-4').getByTestId('line-unit-price')).toHaveText('$34.66');
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$105.97');
    // it needs no approval, so it is sent at once
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=2 number=INV-0000026 total=641.25');
  });

  test('sets the yearly rise when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-02',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Umbrella Co');
    await page.getByTestId('client-form-email').fill('ap@umbrella.example');
    await page.getByTestId('client-form-uplift-pct').fill('2.5');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Umbrella Co');
  });
});
