import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp68 (mutates: [63, 65, 66]): interest now runs from the end of the grace week, not
// the due date, so the 1,000.00 invoice due 2026-03-01 earns 53 days of interest by 2026-04-30
// instead of 60. Carries both tests.
// Overdue invoices earn late interest at the workspace's annual rate (settings.lateInterestRate).
// Once an invoice has been more than 7 days past its due date with something owing, interest runs
// from the end of that week (7 days after the due date), compounded daily at rate / 365
// (Actual/365): a balance B owing for d days earns B x ((1 + rate / 100 / 365)^d - 1), rounded half
// up to the cent. Each payment starts a new period; every period earns interest on what the invoice
// still owed during it (not counting earlier interest or retention) and the periods' interest is
// added up. A payment pays interest earned so far first, then the invoice. The panel shows the
// interest charged; it is part of the amount due, the client's balance and overdue amount, and
// keeps the invoice Overdue until paid. Nothing is charged if everything was paid within the week's
// grace. Planned invoices don't earn it.
test.describe('late interest', () => {
  test('charges daily compound interest on an overdue invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-02-15',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 2000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 500, date: '2026-03-17', allocations: [{ invoiceId: 2, amount: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // from the end of the grace week (2026-03-08) to today: 53 days; 1,000.00 x ((1 + 0.12/365)^53 - 1)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.57');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,017.57');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    // invoice 2: 2,000.00 from 2026-02-22 to the payment on 2026-03-17 (23 days), then what is
    // still owed after the 500.00 pays that interest first, from 2026-03-17 to today (44 days)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$37.25');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,537.25');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$2,554.82');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$2,554.82');

    // paying everything, interest included, clears it
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await page.getByTestId('payment-form-amount').fill('1017.57');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.57');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid late');
  });

  test('charges nothing when paid within the grace week', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-20', dueDate: '2026-04-20',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-25', dueDate: '2026-04-25',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-04-25', allocations: [{ invoiceId: 3, amount: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // invoice 3 was paid 5 days after its due date: late, but within the week's grace
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid late');
    // invoice 4 is 5 days past due: not overdue yet
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });
});
