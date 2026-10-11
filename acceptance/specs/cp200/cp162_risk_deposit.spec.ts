import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp200 (mutates: [162, 174, 182, 193, 198]): every invoice of a high-risk client now
// needs two approvals, so the draft is approved twice before the deposit rule is tried, and the
// euro draft carries both approvals. Carries both tests.
// A draft of a HIGH-risk client can only be sent once the deposits held for it (payments recorded
// as deposits with its reference) are worth at least 30% of its grand total, in the client's
// currency after any conversion fee or card surcharge; until then sending is refused, even when it
// is approved. When it is sent its deposits are used on it first, oldest first, as usual.
test.describe('deposits from high-risk clients', () => {
  test('a high-risk client must pay a deposit before an invoice is sent', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2025-11-11', dueDate: '2025-11-21',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2025-11-17', dueDate: '2026-01-05',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-01-10', allocations: [{ invoiceId: 1, amount: 100 }] },
        { id: 2, clientId: 1, amount: 100, date: '2026-02-03', allocations: [{ invoiceId: 2, amount: 100 }] },
        { id: 3, clientId: 1, amount: 200, date: '2026-03-05', allocations: [], reference: 'RF56 0000 034' },
      ],
    });
    await page.goto('/');

    // days late 20 and 29: 20, then 0.5 x 29 + 0.5 x 20 = 24.5, HIGH
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('HIGH');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-approve').click();
    // a high-risk client's invoice takes two approvals
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 1 more approval');
    await page.getByTestId('invoice-approve').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    // approved, but the 200.00 deposit held for it is only 20% of the 1,000.00: 300.00 is needed
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await page.getByTestId('payment-form-deposit').check();
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-reference').fill('INV-0000034');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$300.00');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    // the deposits held for it are used straight away, oldest first
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED id=3') || l.startsWith('PAYMENT_RECORDED id=4'))).toEqual([
      'PAYMENT_RECORDED id=3 invoice=3 amount=200.00',
      'PAYMENT_RECORDED id=4 invoice=3 amount=100.00',
    ]);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$700.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$0.00');
  });

  test('the deposit counts what it is worth after conversion', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 }, fxFeePct: 2 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' }],
      invoices: [
        { id: 5, clientId: 2, status: 'SENT', issueDate: '2025-10-01', dueDate: '2025-10-31',
          lineItems: [{ id: 5, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 6, clientId: 2, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          approvedTotal: 500, approvedOn: '2026-03-10', approvals: 2,
          lineItems: [{ id: 6, description: 'Build', qty: 1, unitPrice: 500 }] },
      ],
      payments: [
        { id: 5, clientId: 2, amount: 100, date: '2025-11-30', allocations: [{ invoiceId: 5, amount: 100 }] },
        { id: 6, clientId: 2, amount: 165, date: '2026-03-05', currency: 'USD', allocations: [],
          reference: 'INV-0000067' },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('HIGH');
    // 165.00 US dollars is 150.00 euros, less the 2% conversion fee (3.00): 147.00, under 30% of €500.00
    await expect(page.getByTestId('client-row-2').getByTestId('client-credit')).toHaveText('€147.00');
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-6').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
  });
});
