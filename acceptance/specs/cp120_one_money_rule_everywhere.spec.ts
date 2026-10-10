import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every amount, on every screen, is shown with the same rounding, the same thousands separators and
// the right currency. Here one euro client's large balance reads identically on the invoice list,
// the client's aging, the statement and the home screen. A setting chooses whether amounts show the
// currency symbol (the default, €1,234.50) or the currency code (EUR 1,234.50), and whichever is
// chosen is used on every screen. Anchors: nav-settings, settings-money-style (options "symbol" and
// "code"), settings-save.
test.describe('one money rule everywhere', () => {
  test('the same amount reads identically across screens', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' }],
      projects: [{ id: 1, name: 'Intranet', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-25', lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1234.5 }] }],
    });
    await page.goto('/');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('€1,234.50');

    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('aging-current')).toHaveText('€1,234.50');
    await page.getByTestId('client-statement-open').click();
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('€1,234.50');

    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-EUR')).toHaveText('€1,234.50');
  });

  test('amounts can show the currency code instead of the symbol, on every screen', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [
        { id: 1, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' },
        { id: 2, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' },
      ],
      projects: [
        { id: 1, name: 'Intranet', clientId: 1 },
        { id: 2, name: 'Website Rebuild', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-25', lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1234.5 }] },
        { id: 2, projectId: 2, status: 'SENT', dueDate: '2026-02-25', lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('nav-settings').click();
    await page.getByTestId('settings-money-style').selectOption('code');
    await page.getByTestId('settings-save').click();

    // The choice is kept.
    await page.reload();
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-money-style')).toHaveValue('code');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('EUR 1,234.50');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-2').click();
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-amount')).toHaveText('USD 100.00');

    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('aging-current')).toHaveText('EUR 1,234.50');
    await page.getByTestId('client-statement-open').click();
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('EUR 1,234.50');

    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-EUR')).toHaveText('EUR 1,234.50');

    // Switching back to the symbol changes every screen back.
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('settings-money-style').selectOption('symbol');
    await page.getByTestId('settings-save').click();
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-EUR')).toHaveText('€1,234.50');
  });
});
