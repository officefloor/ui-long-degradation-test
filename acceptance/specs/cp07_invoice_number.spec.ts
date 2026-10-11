import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every invoice is numbered INV- + its id padded to six digits + a Luhn check digit over those six
// digits (double every second digit starting with the rightmost, subtract 9 from any result over 9,
// add them all up; the check digit brings the total to a multiple of ten). The number shows in the
// list and the panel. Typing a number into the lookup box opens that invoice and selects its
// client; a number whose check digit is wrong is reported as mistyped and opens nothing.
// Expected numbers computed with acceptance/reference/algorithms.py invoice_number_luhn.
test.describe('invoice numbers', () => {
  test('numbers invoices with a Luhn check digit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 123, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
        { id: 4096, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 25 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-number')).toHaveText('INV-0000075');
    await expect(page.getByTestId('invoice-row-123').getByTestId('invoice-number')).toHaveText('INV-0001230');
    await expect(page.getByTestId('invoice-row-4096').getByTestId('invoice-number')).toHaveText('INV-0040964');
    await page.getByTestId('invoice-row-4096').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('INV-0040964');
  });

  test('a new invoice is numbered from its id', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 58, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 59, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-new').click();
    await expect(page.getByTestId('invoice-row-60').getByTestId('invoice-number')).toHaveText('INV-0000604');
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('INV-0000604');
  });

  test("opens an invoice by its number and selects its client", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 58, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Audit', qty: 2, unitPrice: 30 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('invoice-lookup-input').fill('INV-0000588');
    await page.getByTestId('invoice-lookup-submit').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('INV-0000588');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$60.00'); // 2 x 30
    await expect(page.getByTestId('invoice-row-58')).toBeVisible();
    await expect(page.getByTestId('invoice-row-7')).toHaveCount(0);
  });

  test('refuses a number with the wrong check digit', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 58, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Audit', qty: 2, unitPrice: 30 }] },
      ],
    });
    await page.goto('/');

    // 58's check digit is 8; doubling from the second digit instead would give 1.
    for (const typed of ['INV-0000589', 'INV-0000581']) {
      await page.getByTestId('invoice-lookup-input').fill(typed);
      await page.getByTestId('invoice-lookup-submit').click();
      await expect(page.getByTestId('invoice-lookup-error')).toBeVisible();
      await expect(page.getByTestId('invoice-panel')).toHaveCount(0);
    }
  });
});
