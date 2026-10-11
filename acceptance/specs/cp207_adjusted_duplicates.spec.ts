import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A sent invoice's fingerprint is taken over its lines as adjusted: lines its debit adjustment
// notes added count, lines its credit notes took off don't. A line change on a sent invoice that
// would give it the same fingerprint as another invoice of the client sent within the duplicate
// window is refused (no note is issued), and a draft matching an invoice as adjusted is a possible
// duplicate of it.
test.describe('adjusted invoices and duplicates', () => {
  test('a line change that would duplicate another invoice is refused', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { duplicateDays: 60 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-25', dueDate: '2026-06-30',
          lineItems: [
            { id: 2, description: 'Design', qty: 2, unitPrice: 100 },
            { id: 3, description: 'Hosting', qty: 1, unitPrice: 80 },
          ] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [
            { id: 4, description: 'Hosting', qty: 1, unitPrice: 90 },
            { id: 5, description: 'design', qty: 2, unitPrice: 100 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // taking the hosting off invoice 2 would leave it the same as invoice 1
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('line-row-3').getByTestId('line-remove').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    // and adding the same hosting to invoice 1 would make it the same as invoice 2
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('DCF47DF6');
    await page.getByTestId('line-form-description').fill('Hosting');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('80');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    expect(auditLines().filter((l) => l.startsWith('ADJUSTMENT_ISSUED'))).toEqual([]);
    // hosting at 90.00 is different: the note is issued and the invoice's fingerprint takes it in
    await page.getByTestId('line-form-description').fill('Hosting');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('90');
    await page.getByTestId('line-form-submit').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number=ADJ-0000042 invoice=1 total=90.00');
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('9DD558EC');
    // so the draft with those lines is a possible duplicate of invoice 1 as adjusted
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('9DD558EC');
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('INV-0000018');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
  });
});
