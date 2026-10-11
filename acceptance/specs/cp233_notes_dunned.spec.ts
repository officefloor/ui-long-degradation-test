import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A debit adjustment note is chased with its invoice, not on its own: it shows its invoice's
// dunning level while it is overdue and can't be reminded itself. Reminding an invoice sends the
// reminder for each of its overdue debit notes as well (REMINDER_SENT for each), charging the
// reminder fee once, on the invoice. An invoice's overdue amount, for the dunning minimum, includes
// its overdue debit notes.
test.describe('notes chased with their invoice', () => {
  test('a debit note is chased with its invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, reminderFees: { REMINDER_2: 15 }, dunningMinimum: 25 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          reminders: ['2026-05-20'],
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 300 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-05-15', adjustmentOf: 1,
          lineItems: [{ id: 2, description: 'Extra', qty: 1, unitPrice: 90 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 20 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-05-15', adjustmentOf: 3,
          lineItems: [{ id: 4, description: 'Extra', qty: 1, unitPrice: 10 }] },
        { id: 9, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 9, description: 'Support', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // the note is at its invoice's level and has no reminder of its own
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_2');
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-remind').click();
    // the reminder covers the overdue note too; the fee is charged once, on the invoice
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=1 level=REMINDER_2');
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=2 level=REMINDER_2');
    expect(auditLines().filter((l) => l.startsWith('REMINDER_FEE'))).toEqual(['REMINDER_FEE id=1 amount=15.00']);
    await expect(page.getByTestId('invoice-reminder-fees')).toHaveText('$15.00');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-reminder-fees')).toHaveText('$0.00');
    // 22.00 overdue on invoice 3 is under the 25.00 minimum, but with its note's 11.00 it is 33.00
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_1');
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=4 level=REMINDER_1');
    // with invoice 1 unpaid after its second reminder, a new draft needs approval before it can go
    await page.getByTestId('invoice-row-9').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-9').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
  });

  test('a spread payment pays chased invoices in turn', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example' }],
      invoices: [
        { id: 5, clientId: 2, status: 'SENT', issueDate: '2026-03-20', dueDate: '2026-04-20',
          lineItems: [{ id: 5, description: 'Audit', qty: 1, unitPrice: 200 }] },
        { id: 6, clientId: 2, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-01',
          reminders: ['2026-05-11'],
          lineItems: [{ id: 6, description: 'Build', qty: 1, unitPrice: 300 }] },
        { id: 7, clientId: 2, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-05-15', adjustmentOf: 6,
          lineItems: [{ id: 7, description: 'Extra', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('payment-form-amount').fill('450');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    // invoice 5 (due 2026-04-20) is at REMINDER_1 and invoice 6 at REMINDER_2; overdue first, oldest
    // due date first: invoice 5 (220.00), then invoice 6 (230.00 of 330.00) before its note
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=5 amount=220.00',
      'PAYMENT_RECORDED id=1 invoice=6 amount=230.00',
    ]);
    await page.getByTestId('invoice-row-6').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$100.00');
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
  });
});
