import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';
import { auditLines } from '../../support/audit';

// UPDATED (status is derived from payments): "paying" an invoice means recording a payment that
// covers it. The invoice then reads PAID and a PAYMENT_RECORDED audit line is written.
test.describe('invoice payment', () => {
  test('recording a full payment marks the invoice paid', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-02-01');
    await page.getByTestId('payment-form-submit').click();

    await expect(page.getByTestId('invoice-status')).toHaveText('PAID');
    expect(auditLines()).toContain('PAYMENT_RECORDED id=1 amount=100.00');
  });
});
