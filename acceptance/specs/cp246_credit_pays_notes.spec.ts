import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// When a credit note (or credit adjustment note) is for more than its invoice still owes, the rest
// pays the invoice's unpaid debit adjustment notes first, oldest first (PAYMENT_RECORDED for each),
// and only what is left after them is held as credit (CREDIT_HELD).
test.describe("a credit note pays the invoice's notes", () => {
  test("a credit note's excess pays the invoice's unpaid notes first", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [
            { id: 1, description: 'Design', qty: 1, unitPrice: 100 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 50 },
          ] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 40 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-07-31', adjustmentOf: 1,
          lineItems: [{ id: 4, description: 'Extra', qty: 1, unitPrice: 30 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 5, description: 'Support', qty: 1, unitPrice: 60 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 165, date: '2026-05-20', allocations: [{ invoiceId: 1, amount: 165 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-row-2').getByTestId('line-remove').click();
    // the paid invoice owes nothing, so the 55.00 pays its note's 33.00 and only 22.00 is held as credit
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=3 amount=33.00');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=22.00');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$22.00');
    // the 22.00 is used on the next invoice sent
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=4 amount=22.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$44.00');
  });
});
