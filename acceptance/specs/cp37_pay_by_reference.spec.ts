import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A payment recorded with no invoice open, no split and a reference goes wholly to the selected
// client's invoice with that reference, not to the earliest due. It is refused when the reference is
// mistyped, is not one of this client's invoices, or the amount is more than that invoice's amount
// due.
test.describe('pay by reference', () => {
  test('applies a payment to the invoice its reference names', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 12, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 80 }] },
        { id: 7, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Audit', qty: 1, unitPrice: 60 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('50');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-reference').fill('RF24 0000 125'); // rf_reference of INV-0000125
    await page.getByTestId('payment-form-submit').click();

    await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Sent');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=12 amount=50.00');
    await page.getByTestId('invoice-row-12').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$30.00'); // 80.00 - 50.00
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-reference')).toHaveText('RF24 0000 125');
  });

  test('refuses a reference that is mistyped, foreign or overpaid', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 12, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 80 }] },
        { id: 7, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Audit', qty: 1, unitPrice: 60 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const attempts = [
      ['50', 'RF24 0000 152'],    // fails the mod-97 check
      ['50', 'RF16 0000 075'],    // valid, but Globex's invoice 7
      ['80.01', 'RF24 0000 125'], // more than invoice 12's 80.00 due
    ];
    for (const [amount, reference] of attempts) {
      await page.getByTestId('payment-form-amount').fill(amount);
      await page.getByTestId('payment-form-date').fill('2026-03-09');
      await page.getByTestId('payment-form-reference').fill(reference);
      await page.getByTestId('payment-form-submit').click();
      await expect(page.getByTestId('payment-form-error')).toBeVisible();
    }
    await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Sent');
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
  });
});
