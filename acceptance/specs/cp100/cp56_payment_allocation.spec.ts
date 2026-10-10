import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED payment-allocation spec (carries the payment split forward, adds deposit allocation): a
// lump payment splits across several invoices and each balance and status reflects its share; a
// split that leaves part of the payment unallocated is refused with a visible error; each share is
// audited against its invoice; and a deposit can be allocated across invoices the same way.
test.describe('payment allocation', () => {
  test('splits one payment across two invoices', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-record-payment').click();

    await page.getByTestId('payment-form-amount').fill('150');
    await page.getByTestId('payment-form-date').fill('2026-02-05');
    await page.getByTestId('payment-alloc-1').fill('100');

    // Shares that leave part of the payment unallocated are refused, and the refusal is SHOWN.
    await page.getByTestId('payment-alloc-2').fill('40');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();

    await page.getByTestId('payment-alloc-2').fill('50');
    await page.getByTestId('payment-form-submit').click();

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due-amount')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('PARTIAL');

    // Each share is recorded against the invoice it was allocated to.
    expect(auditLines()).toContain('PAYMENT_RECORDED id=1 amount=100.00');
    expect(auditLines()).toContain('PAYMENT_RECORDED id=2 amount=50.00');
  });

  test('allocates a deposit across invoices', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
      deposits: [{ id: 1, clientId: 1, amount: 150, date: '2026-01-15' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-allocate-deposit').click();

    await page.getByTestId('payment-alloc-1').fill('100');
    await page.getByTestId('payment-alloc-2').fill('50');
    await page.getByTestId('payment-form-submit').click();

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due-amount')).toHaveText('$50.00');
  });
});
