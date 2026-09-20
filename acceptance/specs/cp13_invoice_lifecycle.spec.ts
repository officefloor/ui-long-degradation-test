import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Invoice lifecycle: Draft -> Sent -> Paid. New invoices are Draft. Sending records an audit line.
// Payment is only allowed once an invoice has been sent.
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
});
