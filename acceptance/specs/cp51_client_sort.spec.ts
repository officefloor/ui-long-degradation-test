import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The clients list can be sorted by name or by how much each client owes.
test.describe('client sort', () => {
  test('sorts clients by outstanding amount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 2, status: 'SENT', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 300 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-sort').selectOption('outstanding');

    // Globex owes 300, Acme owes 100 -> Globex first.
    await expect(page.getByTestId(/^client-row-/).first().getByTestId('client-name')).toHaveText('Globex');
  });
});
