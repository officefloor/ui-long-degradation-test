import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Notes can be added to invoices as well as jobs, newest first.
test.describe('invoice notes', () => {
  test('shows and adds notes on an invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      notes: [{ id: 1, targetType: 'invoice', targetId: 1, text: 'Chase payment', at: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-notes')).toBeVisible();
    await expect(page.getByTestId('note-row-1').getByTestId('note-text')).toHaveText('Chase payment');

    await page.getByTestId('note-form-text').fill('Sent reminder');
    await page.getByTestId('note-form-submit').click();
    await expect(page.getByTestId(/^note-row-/)).toHaveCount(2);
  });
});
