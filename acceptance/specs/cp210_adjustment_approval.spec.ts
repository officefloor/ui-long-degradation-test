import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A debit adjustment note is judged for approval like any draft: over the approval limit, a
// discount of more than a fifth, a HIGH-risk client, or taking the client over its credit limit.
// One that needs approval is left as a draft note instead of being sent; approving and then sending
// it issues it (ADJUSTMENT_ISSUED, not INVOICE_SENT). A credit note never needs approval.
test.describe('adjustment notes that need approval', () => {
  test('a debit note that needs approval waits as a draft; credit notes never do', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, approvalLimit: 500 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', creditLimit: 2000 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 100 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-form-description').fill('Extra build');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('600');
    await page.getByTestId('line-form-submit').click();
    // 600.00 + 60.00 = 660.00 is over the 500.00 limit: the note waits as a draft for approval
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Draft');
    expect(auditLines().filter((l) => l.startsWith('ADJUSTMENT_ISSUED'))).toEqual([]);
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=2 total=660.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number=ADJ-0000026 invoice=1 total=660.00');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([]);
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$1,870.00'); // 1,210.00 + 660.00
    // 300.00 + 30.00 is within the limit, but would take the client to 2,200.00, over its 2,000.00
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await page.getByTestId('line-form-description').fill('Support');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('300');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Draft');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // taking the build off is a credit note: issued at once, with no approval
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await page.getByTestId('line-row-1').getByTestId('line-remove').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number=ADJ-0000042 invoice=1 total=-1100.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('$1,230.00');
    // now the support note fits under the limit and goes without approval
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number=ADJ-0000034 invoice=1 total=330.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$1,100.00');
  });
});
