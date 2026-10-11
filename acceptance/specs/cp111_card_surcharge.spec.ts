import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A payment can be made by card (payments[].method 'CARD'). Part of it is the workspace's card
// surcharge (settings.cardSurchargePct): the surcharge is the amount minus the amount divided by 1
// + the rate, rounded half up to the cent, shown on the payment row and written as CARD_SURCHARGE
// payment=<payment id> amount=<surcharge>. Only the rest pays invoices, counts for the minimum part
// payment, or is held as credit.
test.describe('card surcharge', () => {
  test('takes the card surcharge out of a card payment', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { cardSurchargePct: 2.5 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-amount').fill('102.50');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    // 102.50 / 1.025 = 100.00 pays the invoice; 2.50 of it is the card surcharge
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('$102.50');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-surcharge')).toHaveText('$2.50');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('CARD_SURCHARGE payment=1 amount=2.50');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=100.00');
    // no invoice open: 60.00 by card is 60 / 1.025 = 58.536 -> 58.54 after the 1.46 surcharge; 50.00
    // pays invoice 2 and 8.54 is held as credit
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-amount').fill('60');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines()).toContain('CARD_SURCHARGE payment=2 amount=1.46');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=2 amount=50.00');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=8.54');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$8.54');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('-$8.54');
  });

  test('the minimum part payment counts what reaches the invoice', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { cardSurchargePct: 2.5 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    // 10% of 200.00 is 20.00; 20.00 by card is only 19.51 after the surcharge
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-amount').fill('20');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    await page.getByTestId('payment-form-method').selectOption('CARD');
    await page.getByTestId('payment-form-amount').fill('20.50');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$180.00');
  });
});
