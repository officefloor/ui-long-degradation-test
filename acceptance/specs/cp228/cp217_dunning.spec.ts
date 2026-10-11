import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp228 (mutates: [217, 218, 219, 221, 222, 223]): the first reminder is due from 10
// days overdue and every later level needs the reminder before it to be 14 days old, so invoice 1
// (9 days) is not chased yet; the others escalate as before. Carries the test.
// An overdue invoice is chased in levels, shown on the panel (NONE, REMINDER_1, REMINDER_2, FINAL,
// COLLECTIONS), worked out from the days since its due date and the days overdue at which its
// reminders went out (invoices[].reminders, the dates sent): NONE under 10 days overdue; REMINDER_1
// from 10; REMINDER_2 from 21, FINAL from 45 and COLLECTIONS from 60, each only once the reminder
// before it went out at least 14 days earlier. A level never skips the one before it. An invoice
// that is not Overdue (paid, within grace, disputed, promised) is at NONE. Remind sends the
// reminder for the level reached when it has not gone out yet, recording today and writing
// REMINDER_SENT id=<id> level=<level>; otherwise it is refused.
test.describe('chasing overdue invoices', () => {
  test('reminders escalate a level at a time', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-06-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 300 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          reminders: ['2026-05-20'],
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          reminders: ['2026-05-30'],
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          reminders: ['2026-04-10', '2026-05-01'],
          lineItems: [{ id: 4, description: 'Audit', qty: 1, unitPrice: 400 }] },
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          disputedOn: '2026-05-25',
          lineItems: [{ id: 5, description: 'Support', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // due 2026-06-01: 9 days overdue, CMT
    await expect(page.getByTestId('invoice-dunning')).toHaveText('NONE');
    // under 10 days overdue: nothing to send yet
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
    // 31 days overdue, the first reminder sent at 10 days, 21 days ago: the second is due
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_2');
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=2 level=REMINDER_2');
    // also 31 days overdue, but its first reminder went out at 20 days, only 11 days ago
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('REMINDER_1');
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
    // 70 days overdue with two reminders sent: a final notice, not yet collections
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('FINAL');
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_SENT id=4 level=FINAL');
    // a disputed invoice is not overdue, so it is not chased
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('NONE');
    await page.getByTestId('invoice-remind').click();
    await expect(page.getByTestId('invoice-remind-error')).toBeVisible();
    expect(auditLines().filter((l) => l.startsWith('REMINDER_SENT'))).toHaveLength(2);
  });
});
