import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A payment is checked before it is recorded: the invoice must have been sent (a draft takes no
// payments); the amount must be more than zero, have at most two decimals and be no more than the
// amount due; the date must be given, not after today and not before the invoice's issue date. A
// refused payment shows an error and records nothing.
test.describe('payment validation', () => {
  test('refuses a payment on a draft', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Retainer', qty: 1, unitPrice: 150 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('payment-form-amount').fill('10');
    await page.getByTestId('payment-form-date').fill('2026-03-05');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await expect(page.getByTestId(/^payment-row-\d+$/)).toHaveCount(0);
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
  });

  test('refuses a payment that breaks a rule', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Retainer', qty: 1, unitPrice: 150 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    const bad = [
      ['0', '2026-03-05'],        // not more than zero
      ['150.01', '2026-03-05'],   // a cent more than the 150.00 due
      ['10.005', '2026-03-05'],   // three decimals
      ['10', '2026-03-11'],       // after today (2026-03-10)
      ['10', '2026-02-28'],       // before the issue date 2026-03-01
      ['10', ''],                 // no date
    ];
    for (const [amount, date] of bad) {
      await page.getByTestId('payment-form-amount').fill(amount);
      await page.getByTestId('payment-form-date').fill(date);
      await page.getByTestId('payment-form-submit').click();
      await expect(page.getByTestId('payment-form-error')).toBeVisible();
      await expect(page.getByTestId(/^payment-row-\d+$/)).toHaveCount(0);
    }
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$150.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });

  test('accepts a payment of exactly the amount due', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Retainer', qty: 1, unitPrice: 150 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('payment-form-amount').fill('150');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$150.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
  });
});
