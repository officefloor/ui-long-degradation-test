import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED (status derived from payments): sending still moves a draft to SENT and records it, but
// PAID is now reached by recording a payment that covers the invoice, not a manual pay action. A
// draft still cannot be paid until it has been sent.
test.describe('invoice lifecycle', () => {
  test('sending a draft invoice moves it to sent and records it', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('DRAFT');
    await page.getByTestId('invoice-send-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('SENT');
    expect(auditLines()).toContain('INVOICE_SENT id=1 amount=100.00');
  });

  test('a draft invoice cannot be paid until it is sent', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('DRAFT');
    await page.getByTestId('invoice-open-1').click();
    await expect(page.getByTestId('invoice-status')).toHaveText('DRAFT');

    // A draft takes no payment: the app may hide or disable the payment form, or refuse what is
    // entered — either way a payment attempted on a draft must not count.
    const amount = page.getByTestId('payment-form-amount');
    const submit = page.getByTestId('payment-form-submit');
    if ((await submit.count()) > 0 && (await submit.isEnabled()) && (await amount.isEditable())) {
      await amount.fill('100');
      await page.getByTestId('payment-form-date').fill('2026-02-01');
      await submit.click();
    }
    await expect(page.getByTestId('invoice-status')).toHaveText('DRAFT');

    // Once sent it reads SENT — not already paid — and a covering payment then makes it PAID.
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-send-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('SENT');
    await page.getByTestId('invoice-open-1').click();
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-02-01');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-status')).toHaveText('PAID');
  });

  test('a sent invoice becomes paid once a covering payment is recorded', { tag: '@functionality' }, async ({ page }) => {
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
  });
});
