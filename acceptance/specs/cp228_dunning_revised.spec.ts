import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// The dunning levels change: NONE under 10 days overdue; REMINDER_1 from 10; then REMINDER_2 from
// 21, FINAL from 45 and COLLECTIONS from 60, each only once the reminder before it went out at
// least 14 days earlier. A level still never skips the one before it.
test.describe('every level waits two weeks', () => {
  test('the first reminder waits ten days and every later level two weeks after the last', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-30', dueDate: '2026-05-31',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 300 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-06-01',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-03-28',
          reminders: ['2026-04-07', '2026-04-28', '2026-06-01'],
          lineItems: [{ id: 3, description: 'Audit', qty: 1, unitPrice: 400 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-03-28',
          reminders: ['2026-04-07', '2026-04-28', '2026-05-20'],
          lineItems: [{ id: 4, description: 'Hosting', qty: 1, unitPrice: 100 }] },
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-21', dueDate: '2026-04-21',
          reminders: ['2026-05-01', '2026-05-31'],
          lineItems: [{ id: 5, description: 'Support', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 10 days overdue: a first reminder
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_1');
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=1 level=REMINDER_1');
    // 9 days: nothing yet
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('NONE');
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
    // 74 days overdue, but its final notice went out at 65 days, only 9 days ago: still FINAL
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('FINAL');
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
    // its final notice went out at 53 days, 21 days ago: collections
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('COLLECTIONS');
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=4 level=COLLECTIONS');
    // 50 days overdue with a second reminder sent at 40 days: the final notice must wait
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_2');
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
  });
});
