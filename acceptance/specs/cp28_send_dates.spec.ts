import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Sending an invoice moves its issue date to the day it is sent and works its due date out again
// from that date: the last day of the following month.
test.describe('send sets the dates', () => {
  test('sending moves the issue date to today', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-05',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-02-10', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    const row = page.getByTestId('invoice-row-3');
    await expect(row.getByTestId('invoice-status')).toHaveText('Sent');
    await expect(row.getByTestId('invoice-issue')).toHaveText('2026-03-05');
    await expect(row.getByTestId('invoice-due')).toHaveText('2026-04-30'); // last day of April
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=3 number=INV-0000034 total=100.00');
  });

  test('an invoice sent in December is due at the end of January', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-12-03',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-11-20', dueDate: '2026-12-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-issue')).toHaveText('2026-12-03');
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('2027-01-31');
  });
});
