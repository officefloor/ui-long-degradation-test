import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';
import { auditLines } from '../../support/audit';

// UPDATED (invoice lifecycle Draft -> Sent -> Paid): payment is only allowed after an invoice has
// been sent, so this seeds a SENT invoice, then pays it. The paid audit record is unchanged.
test.describe('invoice payment', () => {
  test('paying a sent invoice updates its status', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, amount: 100, status: 'SENT' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('SENT');
    await page.getByTestId('invoice-pay-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');
  });

  test('paying a sent invoice writes an audit record', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, amount: 100, status: 'SENT' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-pay-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');

    expect(auditLines()).toContain('INVOICE_PAID id=1 amount=100.00');
  });
});
