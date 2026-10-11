import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp152 (mutates: [41]): a discount over a fifth of the subtotal no longer needs a
// reason; it is accepted and the invoice needs approval instead, so the two reason tests are
// replaced by tests of the approval (25% is taken without a reason; the 30% and the 25.00-with-a-
// reason invoices are refused until approved). Carries the capped-discount test.
// An invoice discount that takes off more than 20% of the subtotal (the amount actually taken off,
// after any cap) makes the invoice need approval before it can be sent; a reason
// (invoices[].discountReason) is optional, and kept and shown when given.
test.describe('discount reason', () => {
  test('a capped discount within a fifth needs no reason', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 30, discountCap: 50,
          lineItems: [{ id: 1, description: 'Platform', qty: 1, unitPrice: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    // 30% of 400.00 = 120.00, capped at 50.00 = 12.5% of the subtotal: no approval needed
    await expect(page.getByTestId('invoice-discount')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$350.00'); // 400.00 - 50.00
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });

  test('a discount over a fifth of the subtotal needs approval', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // no reason needed: the discount is taken, and the invoice needs approval instead
    await page.getByTestId('discount-form-pct').fill('25');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$50.00'); // 25% of 200.00
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('discount-form-pct').fill('20');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00'); // exactly 20%
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
  });

  test('refuses to send an invoice whose discount needs approval until it is approved', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 30,
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountAmount: 25, discountReason: 'Damaged goods',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$30.00'); // 30% of 100.00
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    // a reason is kept, but no longer enough
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$25.00');
    await expect(page.getByTestId('invoice-discount-reason')).toHaveText('Damaged goods');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=4 total=75.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });
});
