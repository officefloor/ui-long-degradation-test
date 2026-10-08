import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A credit note can be raised against an invoice for an amount, and the act is recorded.
test.describe('credit note', () => {
  test('raises a credit note against an invoice', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('credit-note-form-amount').fill('30');
    await page.getByTestId('credit-note-form-submit').click();

    await expect(page.getByTestId('credit-note-row-1').getByTestId('credit-note-amount')).toHaveText('$30.00');
    expect(auditLines()).toContain('CREDIT_NOTE_ISSUED invoice=1 amount=30.00');
  });
});
