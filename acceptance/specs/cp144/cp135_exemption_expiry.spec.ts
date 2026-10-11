import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp144 (mutates: [115, 131, 135]): a draft is now priced and taxed as of today,
// whatever its date, so the March-dated draft is already taxed (45.00) because the exemption ended
// before today. Carries both tests.
// A tax exemption can end (clients[].taxExemptUntil, the date box next to the exemption on the
// client form, refused without the exemption): the client is exempt only on invoices issued on or
// before that date, so sending a draft after it, which dates it today, taxes it. A credit note is
// treated like the invoice it credits.
test.describe('tax exemption expiry', () => {
  test('a tax exemption ends on its expiry date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', taxExempt: true, taxExemptUntil: '2026-03-31' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-20', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Catering', qty: 1, unitPrice: 400 },
            { id: 2, description: 'Wine', qty: 1, unitPrice: 40, taxRate: 12.5 },
          ] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-15', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Catering', qty: 1, unitPrice: 400 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-04-05', dueDate: '2026-04-30', creditOf: 2,
          lineItems: [{ id: 4, description: 'Catering', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // dated 2026-03-20, but a draft is taxed as of today, after the exemption ended: 10% and 12.5%
    await expect(page.getByTestId('invoice-tax')).toHaveText('$45.00');
    await page.getByTestId('invoice-send').click();
    // issued today: still 10% on the catering and 12.5% on the wine
    await expect(page.getByTestId('invoice-tax')).toHaveText('$45.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$485.00');
    // invoice 2 was issued inside it; its April credit note is treated like it
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$300.00'); // 400.00 - 100.00
  });

  test('records when an exemption ends', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Food Bank');
    await page.getByTestId('client-form-email').fill('office@foodbank.example');
    await page.getByTestId('client-form-tax-exempt').check();
    await page.getByTestId('client-form-exempt-until').fill('2026-12-31');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Food Bank');
    // an end date without the exemption ticked is refused
    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('ap@initech.example');
    await page.getByTestId('client-form-tax-exempt').uncheck();
    await page.getByTestId('client-form-exempt-until').fill('2026-12-31');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-form-error')).toBeVisible();
    await expect(page.getByTestId('client-row-3')).toHaveCount(0);
  });
});
