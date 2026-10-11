import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A sent invoice with no payments can be voided: it becomes Void and writes INVOICE_VOIDED
// id=<id> number=<number>. A void invoice no longer counts towards the client's balance, takes no
// payments (from the form, a split or automatically) and cannot be changed. A draft or an invoice
// with payments cannot be voided.
test.describe('void an invoice', () => {
  test('voids an unpaid sent invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$150.00'); // 100 + 50
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-void').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Void');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Void');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-allocate')).toHaveCount(0);
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$50.00');
    await expect.poll(() => auditLines()).toContain('INVOICE_VOIDED id=1 number=INV-0000018');
  });

  test('refuses to void a draft or an invoice with payments', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Extras', qty: 1, unitPrice: 30 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Support', qty: 1, unitPrice: 60 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 20, date: '2026-03-05', allocations: [{ invoiceId: 4, amount: 20 }] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-void').click();
    await expect(page.getByTestId('invoice-void-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-void').click();
    await expect(page.getByTestId('invoice-void-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_VOIDED'))).toEqual([]);
  });

  test('a void invoice takes no payments', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'VOID', issueDate: '2026-01-01', dueDate: '2026-02-28',
          lineItems: [{ id: 5, description: 'Design', qty: 1, unitPrice: 70 }] },
        { id: 6, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 6, description: 'Hosting', qty: 1, unitPrice: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // No invoice open: the automatic payment skips the older void invoice.
    await page.getByTestId('payment-form-amount').fill('40');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Void');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=6 amount=40.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$0.00');

    await page.getByTestId('invoice-row-5').click();
    await page.getByTestId('payment-form-amount').fill('10');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await expect(page.getByTestId(/^payment-row-\d+$/)).toHaveCount(0);
  });
});
