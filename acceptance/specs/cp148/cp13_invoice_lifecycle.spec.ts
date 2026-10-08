import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED invoice-lifecycle spec (carries Draft -> Sent -> Paid and recurring-draft forward, adds
// the credit-limit block: sending an invoice that would exceed the client's credit limit is
// refused with a warning and the invoice stays a draft).
test.describe('invoice lifecycle', () => {
  test('sending a draft invoice moves it to sent and records it', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, amount: 100, status: 'DRAFT' }],
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
      invoices: [{ id: 1, projectId: 1, amount: 100, status: 'DRAFT' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-pay-1')).toHaveCount(0);
    await page.getByTestId('invoice-send-1').click();
    await page.getByTestId('invoice-pay-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');
  });

  test('a due recurring invoice is generated as a draft', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      recurring: [{ id: 1, projectId: 1, amount: 300, frequency: 'MONTHLY', nextDate: '2026-03-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('recurring-generate-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('DRAFT');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$300.00');
  });

  test('sending over the credit limit is blocked with a warning', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD', creditLimit: 100 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'DRAFT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-send-2').click();
    await expect(page.getByTestId('invoice-credit-warning')).toBeVisible();
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('DRAFT');
  });
});
