import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A draft that would take the client over their credit limit is no longer simply refused: it needs
// approval (shown "Needs approval"), and once approved it can be sent even though it takes them
// over; the client is then on hold for being over the limit. Send all drafts still leaves such
// drafts unless they are approved.
test.describe('approval over the credit limit', () => {
  test('an approved invoice may take the client over its limit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', creditLimit: 1000 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 900 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 250 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // 900.00 + 250.00 would be over the 1,000.00 limit: it needs approval
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=2 total=250.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    // now over the limit, the client is on hold
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('-$150.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('On hold');
  });
});
