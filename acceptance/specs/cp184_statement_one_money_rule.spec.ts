import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every figure on the statement uses the same rounding and currency rule as the invoice, so the
// statement total matches the sum of the invoices' own totals to the cent — including in a
// currency that rounds to the nearest five cents, where each invoice is rounded before adding.
test.describe('statement money rule', () => {
  test('statement total matches the invoice totals exactly', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 3, unitPrice: 33.33 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 0.01 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$99.99');

    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$100.00');
  });

  test('a statement in a five-cent currency adds up the rounded invoice amounts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      currencies: [{ code: 'CHF', symbol: 'CHF ', roundingStep: 0.05 }],
      clients: [{ id: 1, name: 'Zurich AG', email: 'ops@zurich.example', currency: 'CHF' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 10.12 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 10.12 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    // Each invoice rounds to the nearest five centimes: 10.12 -> 10.10.
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('CHF 10.10');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-amount')).toHaveText('CHF 10.10');

    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    // The statement adds the invoices as shown: 10.10 + 10.10 = 20.20 (not 20.24 rounded to 20.25).
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('CHF 20.20');
  });
});
