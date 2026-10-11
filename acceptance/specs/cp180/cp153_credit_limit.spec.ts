import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp180 (mutates: [153]): a draft that would take the client over the limit now needs
// approval rather than being refused outright, so invoice 3 is approved and sent, taking the client
// to -10.00 available and on hold. Carries all three tests.
// A client can have a credit limit (clients[].creditLimit, in their currency; the client form's
// credit limit box). The client list shows what is still available under it: the limit minus the
// client's balance (so late interest counts and unused credit helps). A draft whose sending would
// take the balance plus what it adds (its grand total less any withholding) over the limit needs
// approval, and once approved it can be sent. Send all drafts sends the drafts it can, lowest id
// first, each judged on the balance after the ones before it, and leaves the rest as drafts.
test.describe('credit limit', () => {
  test('refuses to send an invoice that would take the client over its credit limit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', creditLimit: 1000 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 600 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 450 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 60 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 100, date: '2026-03-02', allocations: [] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 600.00 owed less 100.00 of credit = 500.00; 500.00 of the 1,000.00 limit is left
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$500.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('$500.00');
    // 500.00 + 450.00 = 950.00 is within the limit; the credit is used on it as usual
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=100.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('$50.00');
    // 950.00 + 60.00 = 1,010.00 would be over it
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([
      'INVOICE_SENT id=2 number=INV-0000026 total=450.00',
    ]);
    // it needs approval instead, and once approved it can go out over the limit, putting the client on hold
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-approve').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('-$10.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('On hold');
  });

  test('counts late interest but not withholding against the limit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', creditLimit: 2900,
          withholdingPct: 10 },
      ],
      invoices: [
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 1000 }] },
        { id: 5, clientId: 2, status: 'DRAFT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 1800 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    // the overdue invoice owes 1,100.00 less 100.00 withheld, plus its late interest
    await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('$1,017.82');
    await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('$1,882.18');
    // the draft's grand total is 1,980.00, but 180.00 of it is withheld: the client will owe 1,800.00 of it
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,980.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('$82.18');
  });

  test('sending all drafts stops short of the limit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', creditLimit: 500 }],
      invoices: [
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Design', qty: 1, unitPrice: 300 }] },
        { id: 6, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 6, description: 'Build', qty: 1, unitPrice: 250 }] },
        { id: 7, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 7, description: 'Support', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-send-all').click();
    // 300.00 is sent; 300.00 + 250.00 would be over the 500.00 limit, so invoice 6 stays a draft;
    // 300.00 + 150.00 = 450.00 is within it
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-status')).toHaveText('Draft');
    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('client-row-1').getByTestId('client-available')).toHaveText('$50.00');
    // a limit can be set when adding a client
    await page.getByTestId('client-form-name').fill('Umbrella Co');
    await page.getByTestId('client-form-email').fill('ap@umbrella.example');
    await page.getByTestId('client-form-credit-limit').fill('750');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('$750.00');
  });
});
