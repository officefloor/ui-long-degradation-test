import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A planned invoice shows its payoff: the principal still owed on all its instalments, plus what is
// unpaid of the interest of instalments already due (due on or before today) and any late interest.
// A payment of at least the payoff settles the plan: the interest of the instalments not yet due is
// dropped and shown as interest saved, the invoice is Paid, anything beyond is held as credit, and
// PLAN_SETTLED id=<id> saved=<interest saved> is written.
test.describe('paying off a plan early', () => {
  test('pays off a plan early without the future interest', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-15',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 340.02, date: '2026-02-27',
          allocations: [{ invoiceId: 1, amount: 340.02 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // instalment 1 is paid; neither later instalment is due yet, so the payoff is the principal
    // still owed (333.32 + 336.66) without their interest
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$680.05');
    await expect(page.getByTestId('invoice-payoff')).toHaveText('$669.98');
    await page.getByTestId('payment-form-amount').fill('700');
    await page.getByTestId('payment-form-date').fill('2026-03-15');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    // the interest of instalments 2 and 3 is dropped
    await expect(page.getByTestId('invoice-interest-saved')).toHaveText('$10.07');
    await expect.poll(() => auditLines()).toContain('PLAN_SETTLED id=1 saved=10.07');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=1 amount=669.98');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$30.02'); // 700.00 - 669.98
  });

  test('the payoff includes the interest of instalments already due', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 340.02, date: '2026-02-27',
          allocations: [{ invoiceId: 2, amount: 340.02 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // instalment 2 fell due on 2026-03-31, so its interest is owed; only instalment 3's interest
    // is dropped
    await expect(page.getByTestId('invoice-payoff')).toHaveText('$676.68');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$680.05');
  });
});
