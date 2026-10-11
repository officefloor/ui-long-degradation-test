import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp196 (mutates: [169, 170, 178, 185]): each milestone's share is now rounded down and
// the last milestone takes what is left, so the 3,666.67 splits 1,283.33, 1,283.33 and 1,100.01 (it
// was 1,283.34, 1,283.33, 1,100.00). Carries both tests.
// A draft can be billed by milestones (invoices[].milestones: id, description, pct; the milestone
// form, each row showing its amount and status). Their percentages must be over 0 and add up to no
// more than 100, and to exactly 100 before the invoice can be sent. A milestone's amount is each
// milestone's percentage of what the client pays (the grand total less withholding), rounded down
// to the cent, the last milestone taking whatever is left. Once sent, only reached milestones are
// owed: Reach (milestones[].reachedOn, today) writes MILESTONE_REACHED id=<invoice id>
// milestone=<id> amount=<amount> and uses the client's credit on it as sending does. Until then a
// milestone is Pending and is not due, in the balance or overdue; reached milestones are due on the
// invoice's due date and paid in order. With nothing owed now but milestones still pending, the
// invoice is "Awaiting milestone".
test.describe('milestone billing', () => {
  test('bills an invoice by milestones as they are reached', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 3333.34 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('milestone-form-description').fill('Design');
    await page.getByTestId('milestone-form-pct').fill('35');
    await page.getByTestId('milestone-form-submit').click();
    await page.getByTestId('milestone-form-description').fill('Build');
    await page.getByTestId('milestone-form-pct').fill('35');
    await page.getByTestId('milestone-form-submit').click();
    await page.getByTestId('milestone-form-description').fill('Handover');
    await page.getByTestId('milestone-form-pct').fill('30');
    await page.getByTestId('milestone-form-submit').click();
    // 3,333.34 + 10% tax = 3,666.67
    // 3,666.67 split 35/35/30: each share rounded down (1,283.33, 1,283.33, 1,100.00) and the last
    // milestone takes the cent left over: 1,100.01
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-amount')).toHaveText('$1,283.33');
    await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-amount')).toHaveText('$1,283.33');
    await expect(page.getByTestId('milestone-row-3').getByTestId('milestone-amount')).toHaveText('$1,100.01');
    // the percentages may not add up to more than 100
    await page.getByTestId('milestone-form-description').fill('Extra');
    await page.getByTestId('milestone-form-pct').fill('5');
    await page.getByTestId('milestone-form-submit').click();
    await expect(page.getByTestId('milestone-form-error')).toBeVisible();
    await expect(page.getByTestId(/^milestone-row-\d+$/)).toHaveCount(3);
    await page.getByTestId('invoice-send').click();
    // nothing is owed until a milestone is reached
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Awaiting milestone');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('Pending');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$0.00');
    await page.getByTestId('milestone-row-1').getByTestId('milestone-reach').click();
    await expect.poll(() => auditLines()).toContain('MILESTONE_REACHED id=1 milestone=1 amount=1283.33');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,283.33');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('Due');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$1,283.33');
    await page.getByTestId('payment-form-amount').fill('1283.33');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('Paid');
    await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-status')).toHaveText('Pending');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Awaiting milestone');
  });

  test("reaching a milestone uses the client's credit", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          milestones: [{ id: 4, description: 'Start', pct: 25 }, { id: 5, description: 'Finish', pct: 75 }],
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 2000 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          milestones: [{ id: 6, description: 'Start', pct: 50 }],
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 500 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 300, date: '2026-03-02', allocations: [] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$300.00');
    await page.getByTestId('milestone-row-4').getByTestId('milestone-reach').click();
    // 25% of 2,200.00 = 550.00 is owed, and the 300.00 of credit is used on it straight away
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=300.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$250.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$0.00');
    await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-status')).toHaveText('Part paid');
    // milestones that don't add up to 100% can't be sent
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
  });
});
