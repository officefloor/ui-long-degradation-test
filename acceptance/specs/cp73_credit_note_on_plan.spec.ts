import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A credit note on a planned invoice comes off its remaining plan instead of its amount due: the
// instalments due after the credit note's issue date are worked out again by the plan's rule, from
// the principal still owed before them minus the credit note, over the same number of instalments
// at the plan's rate, keeping their due dates; earlier instalments are unchanged. A credit note on
// a plan with an overdue instalment, or for more than that principal, is refused.
test.describe('credit notes on a plan', () => {
  test('a credit note on a plan re-works the instalments still to come', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-15',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-10', dueDate: '2026-04-30', creditOf: 1,
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 340.02, date: '2026-02-27',
          allocations: [{ invoiceId: 1, amount: 340.02 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number=CN-0000026 invoice=1 total=100.00');
    await page.getByTestId('invoice-row-1').click();
    // instalments 2 and 3 fall due after today: 669.98 principal before them, less 100.00,
    // over 2 months at 12%: 569.98 x 0.01 / (1 - 1.01^-2) = 289.27
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-due')).toHaveText('2026-03-31');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('$289.27');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-interest')).toHaveText('$5.70');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-principal')).toHaveText('$283.57');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-balance')).toHaveText('$286.41');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('2026-04-30');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('$289.27');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-interest')).toHaveText('$2.86');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-principal')).toHaveText('$286.41');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-balance')).toHaveText('$0.00');
    // instalment 1 is unchanged
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$340.02');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$918.56');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$578.54');
  });

  test('refuses a credit note on a plan with an overdue instalment', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-04-10', dueDate: '2026-05-31', creditOf: 3,
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 340.02, date: '2026-02-27',
          allocations: [{ invoiceId: 3, amount: 340.02 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // instalment 2 (due 2026-03-31) is overdue
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$1,020.07');
  });
});
