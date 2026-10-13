import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp84 (mutates: [57, 58, 71, 73]): the equal instalment is now rounded up to the next
// whole dollar and the last instalment pays what is left, so the 1,000.00 plan is 341.00, 341.00
// and 338.04 instead of 340.02, 340.02 and 340.03. Carries all three tests.
// A draft can be spread over monthly instalments (invoices[].instalments, 2 to 24, and
// invoices[].instalmentRate, an annual rate from 0 to 30 with up to two decimals, from the plan
// form). The schedule is an ordinary loan of the grand total: monthly rate i = annual rate / 12 /
// 100; the instalment is P x i / (1 - (1 + i)^-n), rounded up to the next whole dollar (P / n at
// 0%); each month's interest is the balance still owed x i, rounded half up to the cent, its
// principal the instalment minus the interest, and the last instalment pays off the whole remaining
// balance plus its interest so the schedule ends at exactly zero. Instalment k is due k months
// after the issue date on the same day (the month's last day when shorter). Each instalment row
// shows its due date, payment, interest, principal and remaining balance; the plan total is the sum
// of the instalments and the amount due is the plan total minus what is paid. Sending dates the
// schedule from the new issue date. An invoice with retention can't have a plan, and credit is not
// used on a planned invoice.
test.describe('instalment plans', () => {
  test('spreads a draft over monthly instalments', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-31',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('plan-form-count').fill('3');
    await page.getByTestId('plan-form-rate').fill('12');
    await page.getByTestId('plan-form-submit').click();
    // i = 12 / 12 / 100 = 0.01; 1000 x 0.01 / (1 - 1.01^-3) = 340.0221, rounded up to 341.00
    // month 1: 1000.00 x 0.01 = 10.00 interest, 331.00 principal, 669.00 left; month 2: 6.69,
    // 334.31, 334.69 left; the last pays the 334.69 left plus 3.3469 -> 3.35 = 338.04
    // due on the 31st of each month, or the month's last day: 02-28, 03-31, 04-30
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('2026-02-28');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$341.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-interest')).toHaveText('$10.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-principal')).toHaveText('$331.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-balance')).toHaveText('$669.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-due')).toHaveText('2026-03-31');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('$341.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-interest')).toHaveText('$6.69');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-principal')).toHaveText('$334.31');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-balance')).toHaveText('$334.69');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('2026-04-30');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('$338.04');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-interest')).toHaveText('$3.35');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-principal')).toHaveText('$334.69');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-balance')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$1,020.04');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,020.04');

    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,020.04');
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number=INV-0000018 total=1000.00');
  });

  test('sending dates the instalments from the day it is sent', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-31',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-02-15', dueDate: '2026-03-31', instalments: 3,
          instalmentRate: 0,
          lineItems: [{ id: 1, description: 'Licence', qty: 1, unitPrice: 100 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 50, date: '2026-03-01', allocations: [] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // at 0% each instalment is 100.00 / 3 = 33.33, rounded up to 34.00, and the last pays the rest
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('2026-03-15');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('$32.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    // issued 2026-03-31: due 04-30, 05-31, 06-30
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('2026-04-30');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-due')).toHaveText('2026-05-31');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('2026-06-30');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$34.00');
    // the client's 50.00 credit is not used on a planned invoice
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$100.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$50.00');
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
  });

  test('refuses a plan that breaks a rule', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Licence', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          retentionPct: 5,
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    const bad = [
      ['1', '12'],       // at least 2 instalments
      ['25', '12'],      // at most 24
      ['2.5', '12'],     // a whole number
      ['3', '30.01'],    // a rate from 0 to 30
      ['3', '-1'],
      ['3', '12.345'],   // at most two decimals
    ];
    for (const [count, rate] of bad) {
      await page.getByTestId('plan-form-count').fill(count);
      await page.getByTestId('plan-form-rate').fill(rate);
      await page.getByTestId('plan-form-submit').click();
      await expect(page.getByTestId('plan-form-error')).toBeVisible();
    }
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
    // invoice 4 holds back retention, so it can't also have a plan
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await page.getByTestId('plan-form-count').fill('3');
    await page.getByTestId('plan-form-rate').fill('12');
    await page.getByTestId('plan-form-submit').click();
    await expect(page.getByTestId('plan-form-error')).toBeVisible();
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
  });
});
