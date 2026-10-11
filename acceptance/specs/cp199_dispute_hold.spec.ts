import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client with a dispute (an invoice, its lines or a milestone) still open more than 30 days after
// it was raised is on hold automatically, with all that a hold means, until it is resolved.
test.describe('long disputes put clients on hold', () => {
  test('a dispute left open over 30 days puts the client on hold', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-10', dueDate: '2026-02-10',
          disputedOn: '2026-02-06',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 800 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-02-10', dueDate: '2026-03-31',
          disputedOn: '2026-02-15',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 800 }] },
      ],
    });
    await page.goto('/');

    // Acme's dispute has been open since 2026-02-06, 32 days: on hold
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('On hold');
    // Globex's since 2026-02-15, 23 days: not yet
    await expect(page.getByTestId('client-row-2').getByTestId('client-status')).toHaveText('Active');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    // resolving the dispute lifts the hold
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-resolve').click();
    await expect(page.getByTestId('client-row-1').getByTestId('client-status')).toHaveText('Active');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
  });
});
