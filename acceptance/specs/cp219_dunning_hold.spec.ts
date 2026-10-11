import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// While a client has an invoice still overdue after its final notice (its third reminder) went out,
// the client is on hold automatically, with everything a hold means. While a client has an invoice
// still overdue after its second reminder went out, every draft of theirs needs approval.
test.describe('unpaid reminders and credit', () => {
  test('an unpaid final notice puts the client on hold, an unpaid second reminder needs approval', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          reminders: ['2026-04-10', '2026-05-01', '2026-05-20'],
          lineItems: [{ id: 1, description: 'Audit', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          reminders: ['2026-05-20', '2026-06-03'],
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 4, description: 'Support', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    // Acme's final notice is unpaid: on hold, so its draft can't be sent
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('On hold');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    // a payment while on hold pays the overdue invoice first; once it is paid the hold lifts
    await page.getByTestId('payment-form-amount').fill('440');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=440.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('Active');
    // though paying 70 days late has made Acme a HIGH risk, whose drafts need approval anyway
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('HIGH');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 2 approvals');
    // Globex's second reminder is unpaid: its draft needs approval
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
  });
});
