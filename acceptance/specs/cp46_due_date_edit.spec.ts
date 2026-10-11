import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A draft's due date can be set by hand: not before the issue date and no more than 120 days after
// it. A due date set by hand (invoices[].manualDueDate) is kept when the invoice is sent (only the
// issue date moves to the send date), and sending is refused if that due date is already before the
// send date.
test.describe('set the due date by hand', () => {
  test("sets a draft's due date and keeps it when sending", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-due-input').fill('2026-06-29'); // issue date + 120 days
    await page.getByTestId('invoice-due-submit').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-06-29');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-issue')).toHaveText('2026-03-10');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-06-29');
  });

  test('refuses a due date outside the allowed range', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    for (const due of ['2026-02-28', '2026-06-30']) { // before the issue date; issue date + 121 days
      await page.getByTestId('invoice-due-input').fill(due);
      await page.getByTestId('invoice-due-submit').click();
      await expect(page.getByTestId('invoice-due-error')).toBeVisible();
      await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-04-30');
    }
  });

  test('a hand-set due date already past stops the send', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-20', manualDueDate: true,
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 10 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-02-01', dueDate: '2026-03-05', manualDueDate: true,
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 10 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-issue')).toHaveText('2026-03-10');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('2026-04-20'); // kept

    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible(); // 2026-03-05 is before today
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
  });
});
