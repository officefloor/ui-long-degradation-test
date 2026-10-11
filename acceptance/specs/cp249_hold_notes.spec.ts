import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A debit adjustment note for a client on hold (for any reason) is left as a draft note instead of
// being sent, and sending it is refused until the hold ends; a credit note is issued at once
// whatever the hold.
test.describe('notes wait while on hold', () => {
  test('a debit note waits while the client is on hold; a credit note does not', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', onHold: true }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 500 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 100 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-form-description').fill('Extra');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('80');
    await page.getByTestId('line-form-submit').click();
    // the note is left as a draft
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Draft');
    expect(auditLines().filter((l) => l.startsWith('ADJUSTMENT_ISSUED'))).toEqual([]);
    await page.getByTestId('line-row-2').getByTestId('line-remove').click();
    // taking the travel off is issued at once
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number=ADJ-0000034 invoice=1 total=-110.00');
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    // once the hold is lifted the note can go
    await page.getByTestId('client-row-1').getByTestId('client-hold').click();
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('Active');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number=ADJ-0000026 invoice=1 total=88.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$638.00');
  });
});
