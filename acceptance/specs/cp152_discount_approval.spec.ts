import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An invoice discount that takes off more than a fifth of the subtotal (the amount actually taken
// off, after any cap) no longer needs a reason: the discount is accepted with or without one (a
// reason given is still kept and shown), and instead the invoice needs approval, whatever its
// total, before it can be sent. A discount of exactly a fifth needs none.
test.describe('large discounts need approval', () => {
  test('a discount of more than a fifth needs approval instead of a reason', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 25% with no reason is accepted now
    await page.getByTestId('discount-form-pct').fill('25');
    await page.getByTestId('discount-form-reason').fill('');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$50.00'); // 25% of 200.00
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=1 total=165.00'); // 150.00 + 15.00
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    // exactly a fifth needs no approval; a reason is still kept when given
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('discount-form-pct').fill('20');
    await page.getByTestId('discount-form-reason').fill('Loyalty');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-discount-reason')).toHaveText('Loyalty');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });

  test('the discount and the limit each call for approval', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { approvalLimit: 1200 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 15,
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1500 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountAmount: 600, discountCap: 400,
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 1500 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 10,
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 1300 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 15% off 1,500.00 leaves 1,275.00: a small discount, but over the 1,200.00 limit
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,275.00');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // a 600.00 discount capped at 400.00 takes off 26.7%: 1,100.00 is within the limit, but the
    // discount is more than a fifth
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-discount')).toHaveText('$400.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,100.00');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // 10% off 1,300.00 leaves 1,170.00: neither
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
  });
});
