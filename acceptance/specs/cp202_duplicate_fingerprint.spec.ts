import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Every invoice with lines shows a fingerprint: the first 8 characters, in capitals, of the SHA-256
// hash (hex) of the client's id, a '|', then its lines joined by ';' in sorted order, each line
// written as description,quantity,unit price in cents: the description in lower case with runs of
// spaces made one and trimmed, the quantity with no trailing zeros, the unit price the line is
// charged at (0 for a line priced in bands). A draft whose fingerprint equals that of an invoice of
// the same client sent within the workspace's duplicate window (settings.duplicateDays, days before
// today) is a possible duplicate: the panel names that invoice, and the draft needs approval before
// it can be sent. Adding, editing or removing a line checks again.
test.describe('possible duplicate invoices', () => {
  test('a draft with the same lines as a recent invoice is a possible duplicate', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, duplicateDays: 60 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          lineItems: [
            { id: 1, description: 'Web design', qty: 2, unitPrice: 500 },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 80 },
          ] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 80 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-30',
          lineItems: [
            { id: 4, description: 'Web design', qty: 2, unitPrice: 500 },
            { id: 5, description: 'Hosting', qty: 1, unitPrice: 80 },
          ] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-02', dueDate: '2026-03-31',
          lineItems: [{ id: 6, description: 'Audit', qty: 1, unitPrice: 300 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 7, description: 'Audit', qty: 1, unitPrice: 300 }] },
        { id: 6, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [
            { id: 9, description: 'Web design', qty: 1, unitPrice: 500 },
            { id: 10, description: 'Web design', qty: 1, unitPrice: 500 },
            { id: 11, description: 'Hosting', qty: 1, unitPrice: 80 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('399D6594');
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
    await page.getByTestId('line-form-description').fill('web  DESIGN ');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('500');
    await page.getByTestId('line-form-submit').click();
    // the same lines as invoice 1 in another order, case and spacing: SHA-256 of
    // '1|hosting,1,8000;web design,2,50000', first 8 characters
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('8865963F');
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('INV-0000018');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    // three days of design is not the same invoice
    await page.getByTestId('line-row-12').getByTestId('line-edit').click();
    await page.getByTestId('line-form-qty').fill('3');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('B89188E5');
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('line-row-12').getByTestId('line-edit').click();
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveText('INV-0000018');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    // approved, it can go: 1,080.00 + 108.00
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_APPROVED id=2 total=1188.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    // Globex's invoice with the same lines is another client's (its id is in the fingerprint)
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('D30579BA');
    // an audit like one sent 100 days ago, outside the 60-day window, is no duplicate
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    // the same work split over two lines of one day each
    await page.getByTestId('invoice-row-6').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-6').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-fingerprint')).toHaveText('DFB113DA');
    // is not the same lines
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
  });
});
