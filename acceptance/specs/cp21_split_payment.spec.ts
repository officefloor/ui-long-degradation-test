import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// One payment can be spread over several of the selected client's invoices: every sent invoice in
// the list has an allocate box (drafts have none). When any box is filled, the payment is recorded
// against those invoices instead of the open one. The amounts must add up exactly to the payment,
// and each must be more than zero and no more than that invoice's amount due, or the payment is
// refused with an error. One PAYMENT_RECORDED line is written per invoice, with the amount applied
// to it, and each invoice's panel shows how much of the payment went to it.
test.describe('split a payment', () => {
  test('splits one payment across several invoices', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Extras', qty: 1, unitPrice: 30 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Audit', qty: 1, unitPrice: 10 }] },
      ],
      payments: [{ id: 7, clientId: 2, amount: 10, date: '2026-03-02', allocations: [{ invoiceId: 4, amount: 10 }] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-allocate')).toHaveCount(0);
    await page.getByTestId('invoice-row-1').getByTestId('invoice-allocate').fill('60');
    await page.getByTestId('invoice-row-2').getByTestId('invoice-allocate').fill('40');
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=8 invoice=1 amount=60.00');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=8 invoice=2 amount=40.00');

    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('payment-row-8').getByTestId('payment-amount')).toHaveText('$100.00');
    await expect(page.getByTestId('payment-row-8').getByTestId('payment-allocated')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$10.00'); // 50.00 - 40.00
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('payment-row-8').getByTestId('payment-allocated')).toHaveText('$60.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$40.00'); // 100.00 - 60.00
  });

  test("refuses a split that doesn't fit", { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Extras', qty: 1, unitPrice: 30 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Audit', qty: 1, unitPrice: 10 }] },
      ],
      payments: [{ id: 7, clientId: 2, amount: 10, date: '2026-03-02', allocations: [{ invoiceId: 4, amount: 10 }] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const splits = [
      ['60', '30'],   // adds up to 90, not the 100 paid
      ['40', '60'],   // 60 is more than invoice 2's 50.00 due
    ];
    for (const [a1, a2] of splits) {
      await page.getByTestId('invoice-row-1').getByTestId('invoice-allocate').fill(a1);
      await page.getByTestId('invoice-row-2').getByTestId('invoice-allocate').fill(a2);
      await page.getByTestId('payment-form-amount').fill('100');
      await page.getByTestId('payment-form-date').fill('2026-03-09');
      await page.getByTestId('payment-form-submit').click();
      await expect(page.getByTestId('payment-form-error')).toBeVisible();
      await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Sent');
      await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Sent');
    }
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
  });

  test('shows each invoice its part of a split payment', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 120 }] },
        { id: 6, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 150, date: '2026-03-05',
          allocations: [{ invoiceId: 5, amount: 100 }, { invoiceId: 6, amount: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('$150.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$20.00'); // 120.00 - 100.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await page.getByTestId('invoice-row-6').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
  });
});
