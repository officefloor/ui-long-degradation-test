import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A client can be put on hold (clients[].onHold) with the Hold button on their row, which also
// lifts it; the row shows the client's status ("Active" or "On hold"), and holding or releasing
// writes CLIENT_HELD id=<id> or CLIENT_RELEASED id=<id>. While a client is on hold their invoices
// cannot be sent (send all drafts sends none) and Apply credit is refused. A payment recorded for a
// client on hold pays no invoice, whatever invoice is open or referenced: it is all held as credit
// (CREDIT_HELD payment=<id> amount=<amount>, no PAYMENT_RECORDED). Lifting the hold applies nothing
// by itself.
test.describe('client hold', () => {
  test('a client on hold gets no invoices and its payments wait as credit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 300 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 200 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-02-15',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 80 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').getByTestId('client-hold').click();
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('On hold');
    await expect.poll(() => auditLines()).toContain('CLIENT_HELD id=1');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    // a payment from a client on hold pays nothing, even with an invoice open: it is all held as credit
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$100.00');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=100.00');
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Overdue');
    await page.getByTestId('client-apply-credit').click();
    await expect(page.getByTestId('client-apply-credit-error')).toBeVisible();
    await page.getByTestId('client-row-1').getByTestId('client-hold').click();
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('Active');
    await expect.poll(() => auditLines()).toContain('CLIENT_RELEASED id=1');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$100.00');
    // nothing is applied by itself; Apply credit pays the overdue invoice 3, then 20.00 of invoice 1
    await page.getByTestId('client-apply-credit').click();
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=3 amount=80.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });

  test('sending all drafts waits until the hold is lifted', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', onHold: true },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 120 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 80 }] },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('On hold');
    await expect(page.getByTestId('client-row-2').getByTestId('client-status')).toHaveText('Active');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-send-all').click();
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('Draft');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Draft');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([]);
    await page.getByTestId('client-row-1').getByTestId('client-hold').click();
    await expect.poll(() => auditLines()).toContain('CLIENT_RELEASED id=1');
    await page.getByTestId('invoice-send-all').click();
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Sent');
  });
});
