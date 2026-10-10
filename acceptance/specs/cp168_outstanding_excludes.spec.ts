import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// What a client owes counts only sent invoices that are not cancelled and not written off, and it
// leaves out the written-off part of an invoice that was only partly written off. The client's
// page shows the total written off for them — whole invoices and parts.
test.describe('outstanding excludes written-off', () => {
  test('written-off invoices drop out of outstanding', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'WRITTEN_OFF', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$100.00');
  });

  test('part write-offs and cancelled invoices are left out, and the written-off total is shown', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'WRITTEN_OFF', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
        { id: 3, projectId: 1, status: 'SENT', writeOff: 80, lineItems: [{ id: 3, description: 'C', qty: 1, unitPrice: 200 }] },
        { id: 4, projectId: 1, status: 'VOID', lineItems: [{ id: 4, description: 'D', qty: 1, unitPrice: 30 }] },
      ],
    });
    await page.goto('/');

    // Owed: 100 + (200 - 80) = 220. The written-off 50, the written-off 80 and the cancelled 30 are out.
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$220.00');

    // Written off for this client: the whole 50 invoice and the 80 part.
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('client-written-off-total')).toHaveText('$130.00');
    await page.getByTestId('client-statement-open').click();
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$220.00');
  });
});
