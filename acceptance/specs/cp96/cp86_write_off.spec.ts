import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp96 (mutates: [63, 80, 86]): a payment now pays the invoice before its late
// interest, so the 400.00 leaves 600.00 earning interest from 2026-03-20 and the amount written off
// changes. Carries both tests.
// The Write off button on a sent invoice with something owed writes off everything still owed on
// it, late charges and retention included (invoices[].writtenOffOn records the day): its status is
// Written off, the panel shows the amount written off, nothing is due, it stops earning interest,
// no longer counts in the client's balance or overdue amount and takes no more payments;
// INVOICE_WRITTEN_OFF id=<id> amount=<amount> is written. Drafts, void invoices and invoices with
// nothing owed can't be written off.
test.describe('write off an invoice', () => {
  test('writes off what is left of an invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 400, date: '2026-03-20', allocations: [{ invoiceId: 1, amount: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$612.26');
    await page.getByTestId('invoice-write-off').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Written off');
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$612.26');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect.poll(() => auditLines()).toContain('INVOICE_WRITTEN_OFF id=1 amount=612.26');
    // it no longer counts towards the balance or the overdue amount
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$100.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');
    // and takes no more payments
    await page.getByTestId('payment-form-amount').fill('10');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
  });

  test('a written-off invoice stops earning interest', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          writtenOffOn: '2026-04-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // written off on 2026-04-01: interest only for the 24 days from 2026-03-08, 1,000.00 x ((1 + 0.12/360)^24 - 1)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$8.03');
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$1,008.03');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Written off');
    // a draft can't be written off
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('invoice-write-off').click();
    await expect(page.getByTestId('invoice-write-off-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
  });
});
