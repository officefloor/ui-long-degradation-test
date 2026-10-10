import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every figure on the home screen uses the base currency and the same exclusions — outstanding,
// the invoices behind it, billings and the top-clients rankings agree, in the base currency, leaving
// out disputed and written-off invoices. The disputes figure counts the disputed invoices, in the
// base currency too. (Each client's own-currency amount in the top-clients list and the
// per-currency outstanding lines stay in that currency.)
test.describe('dashboard one rule', () => {
  test('all figures share the base currency and exclusions', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-28',
      settings: { baseCurrency: 'EUR' },
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [{ id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 110 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-02', disputed: true, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 220 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('€100.00');
    await expect(page.getByTestId('kpi-billings-month')).toHaveText('€100.00');
  });

  test('top clients follow the same rule as the outstanding total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-28',
      settings: { baseCurrency: 'EUR' },
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [
        { id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' },
        { id: 2, name: 'Globex', email: 'b@ex.example', currency: 'USD' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 110 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-02', disputed: true, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 220 }] },
        { id: 3, projectId: 1, status: 'WRITTEN_OFF', issueDate: '2026-02-03', lineItems: [{ id: 3, description: 'z', qty: 1, unitPrice: 55 }] },
        { id: 4, projectId: 2, status: 'SENT', issueDate: '2026-02-03', lineItems: [{ id: 4, description: 'w', qty: 1, unitPrice: 165 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('kpi-outstanding')).toHaveText('€250.00'); // $110 + $165
    await expect(page.getByTestId('kpi-billings-month')).toHaveText('€250.00');
    // Dollar Co owes more only if the disputed invoice is counted
    const rows = page.getByTestId('dashboard-top-clients').getByTestId(/^top-client-row-/);
    await expect(rows.nth(0).getByTestId('top-client-name')).toHaveText('Globex');
    await expect(rows.nth(1).getByTestId('top-client-name')).toHaveText('Dollar Co');
    await expect(page.getByTestId('kpi-top-client-row-2').getByTestId('kpi-top-client-amount')).toHaveText('€150.00');
    await expect(page.getByTestId('kpi-top-client-row-1').getByTestId('kpi-top-client-amount')).toHaveText('€100.00');
    await expect(page.getByTestId('dashboard-disputes-total')).toHaveText('€200.00'); // $220 disputed

    await page.getByTestId('kpi-outstanding-open').click();
    await expect(page.getByTestId(/^kpi-outstanding-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('kpi-outstanding-row-4').getByTestId('kpi-outstanding-row-amount')).toHaveText('€150.00');
  });
});
