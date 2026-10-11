import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A deposit recorded with a reference (an RF reference or invoice number of one of the client's
// drafts, payments[].reference) is held for that invoice: when it is sent it uses that deposit
// first, before any other credit; no other invoice uses it and refunds skip it while that invoice
// is a draft. Whatever is left of it once its invoice has been sent is ordinary credit. A deposit
// naming anything but one of the client's drafts is refused.
test.describe('deposits held for an invoice', () => {
  test('holds a deposit for one invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 80 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-02', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 30, date: '2026-03-01', allocations: [] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-deposit').check();
    await page.getByTestId('payment-form-amount').fill('60');
    await page.getByTestId('payment-form-date').fill('2026-03-05');
    await page.getByTestId('payment-form-reference').fill('RF78 0000 026'); // draft invoice 2
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$90.00'); // 30.00 + 60.00
    // invoice 1 may only use the 30.00 that isn't held for invoice 2
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$50.00'); // 80.00 - 30.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$60.00');
    // invoice 2 uses its own deposit first; the 10.00 left over becomes ordinary credit
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=30.00',
      'PAYMENT_RECORDED id=2 invoice=2 amount=50.00',
    ]);
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$10.00');
  });

  test("refunds and other invoices can't touch a held deposit", { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 40 }] },
      ],
      payments: [
        { id: 3, clientId: 1, amount: 40, date: '2026-03-01', allocations: [], reference: 'RF56 0000 034' },
        { id: 4, clientId: 1, amount: 20, date: '2026-03-02', allocations: [] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // payment 3 is held for draft invoice 3; only payment 4's 20.00 can be refunded
    await page.getByTestId('refund-form-amount').fill('30');
    await page.getByTestId('refund-form-date').fill('2026-03-09');
    await page.getByTestId('refund-form-submit').click();
    await expect(page.getByTestId('refund-form-error')).toBeVisible();
    await page.getByTestId('refund-form-amount').fill('20');
    await page.getByTestId('refund-form-submit').click();
    await expect.poll(() => auditLines()).toContain('CREDIT_REFUNDED payment=4 amount=20.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$40.00');
    // a deposit can only be held for one of the client's drafts
    await page.getByTestId('payment-form-deposit').check();
    await page.getByTestId('payment-form-amount').fill('10');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-reference').fill('RF34 0000 042'); // invoice 4 is sent
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    expect(auditLines().filter((l) => l.startsWith('DEPOSIT_RECORDED'))).toEqual([]);
  });
});
