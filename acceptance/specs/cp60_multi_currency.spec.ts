import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each client has their own currency. Their money is shown in that currency ($ for USD, EUR for
// euros). On the home screen the outstanding totals are kept separate per currency and never added
// together.
test.describe('multi currency', () => {
  test('sets a client currency and shows their money in it', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await page.getByTestId('client-currency-select').selectOption('EUR');
    await page.getByTestId('client-currency-save').click();
    await expect(page.getByTestId('client-currency')).toHaveText('EUR');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('€100.00');
  });

  test('home screen keeps totals separate per currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' },
        { id: 2, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' },
      ],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 2, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$100.00');
    await expect(page.getByTestId('dashboard-outstanding-EUR')).toHaveText('€200.00');
    await expect(page.getByTestId('dashboard-outstanding-total')).toHaveCount(0);
  });
});
