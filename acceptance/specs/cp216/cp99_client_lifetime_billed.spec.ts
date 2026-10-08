import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED lifetime-billed spec: the total is net of credits and write-offs.
test.describe('client lifetime billed', () => {
  test('sums all invoices ever billed to the client', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'PAID', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('client-lifetime-billed')).toHaveText('$300.00');
  });

  test('is net of credits and write-offs', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'PAID', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 300 }] },
        { id: 2, projectId: 1, status: 'WRITTEN_OFF', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
      creditNotes: [{ id: 1, invoiceId: 1, amount: 50, date: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('client-lifetime-billed')).toHaveText('$250.00');
  });
});
