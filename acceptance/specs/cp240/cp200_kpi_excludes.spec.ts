import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED kpi-exclusions spec: carries the exclusions and base-currency behaviour forward, and
// holds every home-screen figure to one rule — base currency, same exclusions.
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
});
