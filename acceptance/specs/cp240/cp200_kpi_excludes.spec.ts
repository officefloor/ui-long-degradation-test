import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED kpi-exclusions spec: carries the exclusions and every base-currency total forward, and
// holds every home-screen figure to one rule — base currency, same exclusions — including the
// top-clients rankings and the invoices behind the outstanding total.
test.describe('kpi outstanding exclusions', () => {
  test('excludes disputed and written-off invoices', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', disputed: true, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
        { id: 3, projectId: 1, status: 'WRITTEN_OFF', lineItems: [{ id: 3, description: 'z', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('$100.00');
  });

  test('billings excludes disputed and written-off consistently', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-28',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-02', disputed: true, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
        { id: 3, projectId: 1, status: 'WRITTEN_OFF', issueDate: '2026-02-03', lineItems: [{ id: 3, description: 'z', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('$100.00');
    await expect(page.getByTestId('kpi-billings-month')).toHaveText('$100.00');
  });

  test('shows every figure in the chosen base currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      settings: { baseCurrency: 'EUR' },
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [{ id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 110 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('€100.00');
  });

  test('shows billings, collections, overdue and top lists in the base currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-20',
      settings: { baseCurrency: 'EUR' },
      fxRates: [{ currency: 'EUR', date: '2026-01-01', rate: 1.10 }],
      clients: [{ id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-02-10', lineItems: [{ id: 1, description: 'w', qty: 1, unitPrice: 110 }] }, // 10 days overdue
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-05', dueDate: '2026-04-30', lineItems: [{ id: 2, description: 'x', qty: 1, unitPrice: 220 }] },
        { id: 3, projectId: 1, status: 'SENT', issueDate: '2026-02-02', dueDate: '2026-04-30', lineItems: [{ id: 3, description: 'y', qty: 1, unitPrice: 88 }] },
        { id: 4, projectId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-04-30', lineItems: [{ id: 4, description: 'z', qty: 1, unitPrice: 110 }] },
      ],
      payments: [{ id: 1, invoiceId: 3, amount: 55, date: '2026-02-18' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('kpi-outstanding')).toHaveText('€430.00'); // $473
    await expect(page.getByTestId('kpi-billings-month')).toHaveText('€380.00'); // $418 raised in February
    await expect(page.getByTestId('kpi-ytd-billings')).toHaveText('€480.00'); // $528 raised this year
    await expect(page.getByTestId('kpi-ytd-collected')).toHaveText('€50.00'); // $55
    await expect(page.getByTestId('dashboard-cash-week')).toHaveText('€50.00');
    await expect(page.getByTestId('dashboard-overdue-amount')).toHaveText('€100.00'); // $110
    const overdue = page.getByTestId('dashboard-top-overdue').getByTestId(/^overdue-client-row-/);
    await expect(overdue.nth(0).getByTestId('overdue-client-amount')).toHaveText('€100.00');
    await expect(page.getByTestId('kpi-top-client-row-1').getByTestId('kpi-top-client-amount')).toHaveText('€430.00');

    await page.getByTestId('kpi-outstanding-open').click();
    await expect(page.getByTestId('kpi-outstanding-row-1').getByTestId('kpi-outstanding-row-amount')).toHaveText('€100.00');
  });

  test('shows the 30-day forecast in the base currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-01',
      settings: { baseCurrency: 'EUR' },
      fxRates: [{ currency: 'EUR', date: '2026-01-01', rate: 1.10 }],
      clients: [{ id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-16', dueDate: '2026-02-15', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 220 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-01-20', dueDate: '2026-04-01', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 330 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('forecast-30day-total')).toHaveText('€200.00'); // $220 due within 30 days
  });

  test('outstanding and billings agree in base currency with exclusions', { tag: '@functionality' }, async ({ page }) => {
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
