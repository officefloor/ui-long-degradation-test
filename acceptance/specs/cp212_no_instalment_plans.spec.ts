import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Instalment plans are gone: there is no plan form, no instalment rows, plan total, plan fee,
// payoff or interest saved, and no skipping an instalment; the workspace has no plan fee and
// invoices no plan fields. Every invoice is due in full on its due date, earns late interest on
// what it owes once overdue, is judged for approval on its grand total, and has the client's credit
// used on it when it is sent.
test.describe('no instalment plans', () => {
  test('an invoice has no instalment plan and is due in full', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, approvalLimit: 1050 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 300, date: '2026-06-01', allocations: [], deposit: true }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('plan-form-count')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-rate')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-down')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-submit')).toHaveCount(0);
    await expect(page.getByTestId('invoice-plan-total')).toHaveCount(0);
    await expect(page.getByTestId('invoice-plan-fee')).toHaveCount(0);
    // judged on its grand total: 1,100.00 is over the 1,050.00 limit
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total=1100.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    // the 300.00 deposit is used on it, and the rest is due in full at the end of next month
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=300.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$800.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-07-31');
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
  });
});
