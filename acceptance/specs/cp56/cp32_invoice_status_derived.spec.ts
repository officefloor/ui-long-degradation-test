import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An invoice's status is worked out from its payments: PARTIAL once some is paid, PAID once it is
// covered. Recording a payment replaces flipping the invoice to paid by hand, and records an audit
// line. (A sent, unpaid invoice reads SENT.)
test.describe('derived invoice status', () => {
  test('a part payment then full payment drive the status', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('SENT');

    await page.getByTestId('invoice-open-1').click();
    await page.getByTestId('payment-form-amount').fill('40');
    await page.getByTestId('payment-form-date').fill('2026-02-01');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-status')).toHaveText('PARTIAL');
    expect(auditLines()).toContain('PAYMENT_RECORDED id=1 amount=40.00');

    await page.getByTestId('payment-form-amount').fill('60');
    await page.getByTestId('payment-form-date').fill('2026-02-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-status')).toHaveText('PAID');
  });
});
