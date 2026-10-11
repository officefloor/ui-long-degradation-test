import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Overdue invoices earn late interest at the workspace's annual rate (settings.lateInterestRate).
// Once an invoice has been more than 7 days past its due date with something owing, interest runs
// from the due date, compounded daily at rate / 365 (Actual/365): a balance B owing for d days
// earns B x ((1 + rate / 100 / 365)^d - 1), rounded half up to the cent. Each payment starts a new
// period; every period earns interest on what the invoice still owed during it (not counting
// earlier interest or retention) and the periods' interest is added up. A payment pays interest
// earned so far first, then the invoice. The panel shows the interest charged; it is part of the
// amount due, the client's balance and overdue amount, and keeps the invoice Overdue until paid.
// Nothing is charged if everything was paid within the week's grace. Planned invoices don't earn
// it.
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
    // due 2026-03-01, 60 days ago: 1,000.00 x ((1 + 0.12/365)^60 - 1) = 19.9186 (simple interest: 19.73)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$19.92');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,019.92');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    // invoice 2: 2,000.00 for the 30 days to the payment on 2026-03-17, then what is still owed
    // after the 500.00 pays that interest first, for the 44 days to today
    await expect(page.getByTestId('invoice-interest')).toHaveText('$41.96');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,541.96');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$2,561.88');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$2,561.88');

    // paying everything, interest included, clears it
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await page.getByTestId('payment-form-amount').fill('1019.92');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$19.92');
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
