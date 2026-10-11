import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A reference typed on the payment form may carry an amount after an equals sign (INV-0000018=50):
// that amount goes to that invoice, the rest of the payment goes to the references without an
// amount in the usual order (overdue first, then the largest amount due), and anything left is held
// as credit. Refused when the stated amounts come to more than the payment, or one is zero or less,
// has more than two decimals, is more than that invoice owes, or is below the minimum part payment.
test.describe('references with amounts', () => {
  test('a reference can carry the amount it gets', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 60 }] },
        { id: 12, clientId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 40 }] },
        { id: 123, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Training', qty: 1, unitPrice: 30 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('150');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-reference').fill('INV-0000018=50, RF16 0000 075, INV-0001230=30');
    await page.getByTestId('payment-form-submit').click();
    // 50.00 to invoice 1 and 30.00 to invoice 123 as stated; the other 70.00 to invoice 7 (60.00),
    // and the last 10.00 is held as credit
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=50.00');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=123 amount=30.00');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=7 amount=60.00');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=10.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-123').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$10.00');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$50.00'); // 100.00 - 50.00
  });

  test('refuses amounts that do not fit', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 60 }] },
        { id: 12, clientId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 40 }] },
        { id: 123, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Training', qty: 1, unitPrice: 30 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const attempts = [
      'INV-0000018=80, RF16 0000 075=30',   // 110.00 is more than the 100.00 paid
      'INV-0000018=0, RF16 0000 075',       // an amount must be more than zero
      'RF16 0000 075=61',                   // invoice 7 owes 60.00
      'INV-0000018=9.99',                   // under 10% of invoice 1's 100.00
      'INV-0000018=10.005',                 // three decimals
    ];
    for (const references of attempts) {
      await page.getByTestId('payment-form-amount').fill('100');
      await page.getByTestId('payment-form-date').fill('2026-04-20');
      await page.getByTestId('payment-form-reference').fill(references);
      await page.getByTestId('payment-form-submit').click();
      await expect(page.getByTestId('payment-form-error')).toBeVisible();
    }
    for (const id of [1, 7, 123]) {
      await expect(page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status')).toHaveText('Sent');
    }
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
  });
});
