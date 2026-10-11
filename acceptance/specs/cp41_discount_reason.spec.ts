import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice discount that takes off more than 20% of the subtotal (the amount actually taken off,
// after any cap) needs a reason (invoices[].discountReason, entered with the discount and shown on the
// invoice). Such a discount without a reason is refused, and an invoice whose discount needs a reason
// but has none cannot be sent.
test.describe('discount reason', () => {
  test('a discount over a fifth of the subtotal needs a reason', { tag: '@error' }, async ({ page }) => {
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
    await page.getByTestId('discount-form-pct').fill('25');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('discount-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$0.00');
    await page.getByTestId('discount-form-reason').fill('Loyalty');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$50.00'); // 25% of 200.00
    await expect(page.getByTestId('invoice-discount-reason')).toHaveText('Loyalty');

    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('discount-form-pct').fill('20');
    await page.getByTestId('discount-form-reason').fill('');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00'); // exactly 20% needs no reason
  });

  test('refuses to send an invoice whose discount needs a reason', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 30,
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountAmount: 25,
          discountReason: 'Damaged goods', lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$30.00'); // 30% of 100.00
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');

    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-discount')).toHaveText('$25.00');
    await expect(page.getByTestId('invoice-discount-reason')).toHaveText('Damaged goods');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });

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
    // 30% of 400.00 = 120.00, capped at 50.00 = 12.5% of the subtotal
    await expect(page.getByTestId('invoice-discount')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$350.00'); // 400.00 - 50.00
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });
});
