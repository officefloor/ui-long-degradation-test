import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A full account statement for a client with every rule applied. The client trades in EUR; home is
// USD at a rate of 1.10. One SENT invoice of EUR 100 and a credit note of EUR 20 leave EUR 80
// owing, which is EUR 88.00... shown as the client total EUR 80.00 and the converted home total
// $88.00. Credits for the period total EUR 20.00.
test.describe('full account statement', () => {
  test('shows balance, credits and the converted home total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Euro Co', email: 'eu@acme.example', currency: 'EUR' }],
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      creditNotes: [{ id: 1, invoiceId: 1, amount: 20, date: '2026-02-15' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('statement-print-view').click();

    await expect(page.getByTestId('statement-credits-total')).toHaveText('€20.00');
    await expect(page.getByTestId('statement-grand-total')).toHaveText('€80.00');
    await expect(page.getByTestId('statement-home-total')).toHaveText('$88.00');
  });
});
