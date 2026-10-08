import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Emailing a statement to a client records that it was sent (audit channel).
test.describe('email statement', () => {
  test('records that the statement was emailed', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    await page.getByTestId('statement-email').click();

    await expect(page.getByTestId('statement-email-confirm')).toBeVisible();
    expect(auditLines()).toContain('STATEMENT_EMAILED client=1');
  });
});
