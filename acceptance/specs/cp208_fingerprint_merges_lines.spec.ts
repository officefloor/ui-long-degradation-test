import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Before the fingerprint is taken, lines with the same description (lower case, spaces collapsed
// and trimmed) and the same unit price are merged into one, their quantities added, so work split
// over several lines still matches. A draft is also a possible duplicate of an earlier draft (lower
// id) of the same client with the same fingerprint; the earlier one is not flagged.
test.describe('split lines still match', () => {
  test('lines with the same description and price count as one, and drafts are checked against drafts', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { duplicateDays: 60 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          lineItems: [{ id: 1, description: 'Training', qty: 3, unitPrice: 200 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [
            { id: 2, description: 'Training', qty: 1, unitPrice: 200 },
            { id: 3, description: 'training ', qty: 2, unitPrice: 200 },
          ] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 4, description: 'Workshop', qty: 1, unitPrice: 500 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-06-09', dueDate: '2026-06-30',
          lineItems: [{ id: 5, description: 'workshop', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // one day and two days of training at 200.00 merge into three days: the lines of invoice 1
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('6EADF0BC');
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('INV-0000018');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // at 210.00 the second line is a different price, so nothing merges
    await page.getByTestId('line-row-3').getByTestId('line-edit').click();
    await page.getByTestId('line-form-unit-price').fill('210');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('B592548D');
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    // two drafts with the same workshop: the later one is the possible duplicate
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('INV-0000034');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // and once the first is sent, the second still matches it
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('INV-0000034');
  });
});
