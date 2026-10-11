import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A recurring invoice can have an end date (invoices[].recurUntil, the panel's Recurring until
// box), which the drafts it generates keep. The period a generated draft bills stops at the end
// date when it falls inside that month (and is prorated as usual); once the next period would start
// after it, Generate is refused. Generate is also refused for a client on hold.
test.describe('recurring until a date', () => {
  test('stops a recurring invoice on its end date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-02',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', onHold: true },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-02', dueDate: '2026-03-31', recurring: true,
          lineItems: [
            { id: 1, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-02-01', periodEnd: '2026-02-28' },
          ] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-02-02', dueDate: '2026-03-31', recurring: true,
          lineItems: [
            { id: 3, description: 'Hosting', qty: 1, unitPrice: 200, periodStart: '2026-02-01', periodEnd: '2026-02-28' },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-recur-until').fill('2026-03-17');
    await page.getByTestId('invoice-recur-until-submit').click();
    await page.getByTestId('invoice-generate').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from=INV-0000018 to=INV-0000042');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('line-row-4').getByTestId('line-period')).toHaveText('2026-03-01 to 2026-03-17');
    // the last period runs from 2026-03-01 to the 17th: 450 x 17/31 = 246.77
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$246.77');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$271.45');
    if ((await page.getByTestId('invoice-panel-status').textContent())?.trim() === 'Draft') {
      await page.getByTestId('invoice-send').click();
    }
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    // its next period would start after the end date: nothing more to generate
    await page.getByTestId('invoice-generate').click();
    await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
    // nothing is generated for a client on hold
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-generate').click();
    await expect(page.getByTestId('invoice-generate-error')).toBeVisible();
    await expect(page.getByTestId(/^invoice-row-\d+$/)).toHaveCount(1);
  });
});
