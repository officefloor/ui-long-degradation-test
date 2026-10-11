import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// The workspace can set a dunning minimum (settings.dunningMinimum, US dollars converted to the
// client's currency at today's rate, rounded down). An invoice whose overdue amount is under it is
// at NONE: it can't be reminded and its reminders count for nothing until more is overdue.
test.describe('too little to chase', () => {
  test('an invoice with less than the minimum overdue is not chased', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, dunningMinimum: 25, usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 30 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          lineItems: [
            { id: 3, description: 'Design', qty: 1, unitPrice: 10 },
            { id: 4, description: 'Travel', qty: 1, unitPrice: 90 },
          ] },
        { id: 5, clientId: 2, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          lineItems: [{ id: 5, description: 'Hosting', qty: 1, unitPrice: 22.73 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 1080, date: '2026-05-25',
          allocations: [{ invoiceId: 1, amount: 1080 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 1,100.00 less 1,080.00 paid leaves 20.00 overdue, under the 25.00 minimum
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-dunning')).toHaveText('NONE');
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
    // 33.00 is enough
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=2 level=REMINDER_1');
    // taking the travel off invoice 3 (99.00) leaves 11.00 overdue: no longer chased
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_1');
    await page.getByTestId('line-row-4').getByTestId('line-remove').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$11.00');
    await expect(page.getByTestId('invoice-dunning')).toHaveText('NONE');
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
    // in euros the minimum is 25.00 / 1.10 = 22.7272, down to 22.72: 25.00 owed is chased
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_1');
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=5 level=REMINDER_1');
  });
});
