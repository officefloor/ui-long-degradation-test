import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp52 (mutates: [17, 22, 37, 50]): paying more than the named invoice owes is no
// longer refused; the rest is held as credit, so the refusal test keeps only the mistyped and
// foreign references and a new test pays 100.00 against 80.00 due. Carries the first test.
// A payment recorded with no invoice open, no split and a reference goes wholly to the selected
// client's invoice with that reference, not to the earliest due. It is refused when the reference is
// mistyped or is not one of this client's invoices; anything paid beyond that invoice's amount due is
// held as credit.
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

  test('refuses a mistyped or foreign reference', { tag: '@error' }, async ({ page }) => {
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

  test('keeps what a reference payment overpays as credit', { tag: '@core' }, async ({ page }) => {
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
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-reference').fill('RF24 0000 125'); // invoice 12, 80.00 due
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Sent');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=12 amount=80.00');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=20.00'); // 100.00 - 80.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$20.00');
  });
});
