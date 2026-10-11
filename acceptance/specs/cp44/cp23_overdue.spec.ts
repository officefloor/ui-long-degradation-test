import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp44 (mutates: [23]): an invoice is overdue only once today is more than 7 days past
// its due date, so invoice 6 (due 5 days ago) is now Sent instead of Overdue. Carries both tests.
// A sent invoice that still has something due more than 7 days after its due date is Overdue, part
// paid or not; it shows as its status in the list and the panel. Within the week's grace it is not
// overdue; paid and draft invoices are never overdue.
test.describe('overdue invoices', () => {
  test('marks invoices still owing after their due date Overdue', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-15',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-15',
          lineItems: [{ id: 4, description: 'Training', qty: 1, unitPrice: 100 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 5, description: 'Extras', qty: 1, unitPrice: 100 }] },
        { id: 6, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-10',
          lineItems: [{ id: 6, description: 'Licences', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 40, date: '2026-03-20', allocations: [{ invoiceId: 2, amount: 40 }] },
        { id: 2, clientId: 1, amount: 100, date: '2026-03-20', allocations: [{ invoiceId: 3, amount: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const status = (id: number) => page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status');
    await expect(status(1)).toHaveText('Overdue');   // unpaid, due 15 days ago
    await expect(status(2)).toHaveText('Overdue');   // part paid, 60.00 still due
    await expect(status(3)).toHaveText('Paid');      // paid in full on 03-20
    await expect(status(4)).toHaveText('Sent');      // due today
    await expect(status(5)).toHaveText('Draft');
    await expect(status(6)).toHaveText('Sent');      // due 5 days ago, within the grace week
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
  });

  test('a part payment leaves an overdue invoice Overdue', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-15',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await page.getByTestId('payment-form-amount').fill('30');
    await page.getByTestId('payment-form-date').fill('2026-04-15');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$70.00'); // 100.00 - 30.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Overdue');
  });
});
