import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Wherever a payment reference is typed, the invoice number is accepted too (INV-0000075, any
// capitals): a number whose Luhn check digit is wrong is mistyped; otherwise it must name the right
// invoice exactly as an RF reference must. The payment stores and shows that invoice's RF reference.
test.describe('invoice number as reference', () => {
  test('accepts the invoice number as the reference', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-7').click();
    await page.getByTestId('payment-form-amount').fill('40');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-reference').fill('inv-0000075');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$40.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-reference')).toHaveText('RF16 0000 075');
  });

  test('refuses an invoice number with a wrong check digit', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-7').click();
    await page.getByTestId('payment-form-amount').fill('40');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-reference').fill('INV-0000076'); // 7's check digit is 5
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
  });

  test('pays the invoice a number names when none is open', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 123, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 60 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('60');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-reference').fill('INV-0001230');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-row-123').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Sent');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=123 amount=60.00');
  });
});
