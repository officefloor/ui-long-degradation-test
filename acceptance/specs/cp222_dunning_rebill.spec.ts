import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Rebilling an invoice that has had reminders moves them to the replacement (invoices[].reminders),
// and the replacement keeps the old invoice's due date when it is sent instead of being re-dated,
// so it is chased from where the old one was. An invoice whose final notice has gone out can't be
// rebilled.
test.describe("a rebill doesn't reset the chasing", () => {
  test('a replacement keeps the due date and reminders of the invoice it replaces', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 4, name: 'Umbrella Co', email: 'ap@umbrella.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          reminders: ['2026-05-20', '2026-06-03'],
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 4, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          reminders: ['2026-04-10', '2026-05-01', '2026-05-20'],
          lineItems: [{ id: 2, description: 'Audit', qty: 1, unitPrice: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_2');
    await page.getByTestId('invoice-rebill').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    // sent today but still due 2026-05-10, with its two reminders: overdue at once and not chased again
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('2026-05-10');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_2');
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
    // an invoice whose final notice has gone out can't be rebilled
    await page.getByTestId('client-row-4').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-rebill').click();
    await expect(page.getByTestId('invoice-rebill-error')).toBeVisible();
  });

  test('a replacement made earlier is sent with the old due date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example' }],
      invoices: [
        { id: 5, clientId: 2, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30',
          rebilledOn: '2026-06-01', reminders: ['2026-05-10'],
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 300 }] },
        { id: 6, clientId: 2, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-06-01', creditOf: 5,
          lineItems: [{ id: 6, description: 'Build', qty: 1, unitPrice: 300, creditOfLine: 5 }] },
        { id: 7, clientId: 2, status: 'DRAFT', issueDate: '2026-06-01', dueDate: '2026-04-30', replaces: 5,
          reminders: ['2026-05-10'],
          lineItems: [{ id: 7, description: 'Build', qty: 1, unitPrice: 300 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-7').click();
    await expect(page.getByTestId('invoice-replaces')).toHaveText('INV-0000059');
    await page.getByTestId('invoice-send').click();
    // due 2026-04-30, 41 days ago, first reminder at 10 days, 31 days ago: the second is due
    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-due')).toHaveText('2026-04-30');
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_2');
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=7 level=REMINDER_2');
  });
});
