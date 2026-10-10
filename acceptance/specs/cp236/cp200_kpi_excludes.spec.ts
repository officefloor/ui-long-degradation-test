import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED kpi-exclusions spec: carries the outstanding and billings exclusions forward and shows
// every home-screen total in the chosen base currency — outstanding and the invoices behind it,
// billings, collections, overdue, the top lists and the 30-day forecast.
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
});
