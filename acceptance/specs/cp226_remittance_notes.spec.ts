import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An adjustment note carries its invoice's purchase order number. When remittance text is matched
// to an invoice, that invoice's debit notes are paid straight after it, oldest first, before
// anything else.
test.describe('remittance and adjustment notes', () => {
  test('a payment matched to an invoice pays its notes next, and new notes carry its purchase order', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          poNumber: 'PO-7781',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-07-31', adjustmentOf: 1,
          poNumber: 'PO-7781',
          lineItems: [{ id: 2, description: 'Extra', qty: 1, unitPrice: 90 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          poNumber: 'PO-1200',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 110, date: '2026-06-01', remittance: 'PO7781',
          allocations: [{ invoiceId: 1, amount: 110 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('440');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-remittance').fill('po 7781');
    await page.getByTestId('payment-form-submit').click();
    // 'po 7781' matches PO-7781, and of the invoices carrying it invoice 1 owes the most: its 330.00,
    // then its note's 99.00, before the smaller invoice 3 gets the last 11.00
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=2 invoice=1 amount=330.00',
      'PAYMENT_RECORDED id=2 invoice=2 amount=99.00',
      'PAYMENT_RECORDED id=2 invoice=3 amount=11.00',
    ]);
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('INV-0000018');
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-match')).toHaveText('INV-0000018');
    await page.getByTestId('line-form-description').fill('Travel');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('30');
    await page.getByTestId('line-form-submit').click();
    // the new note carries PO-7781
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number=ADJ-0000042 invoice=1 total=33.00');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-po')).toHaveText('PO-7781');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Part paid');
  });
});
