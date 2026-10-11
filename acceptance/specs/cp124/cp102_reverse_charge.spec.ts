import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp124 (mutates: [102, 117]): a tax number now counts only when its two letters are
// the client's region; the tests' clients all quote their own region's number, so their figures
// hold, and a new test shows a California client with a New York number taxed as usual. Carries
// both tests.
// A client can have a tax number (clients[].taxNumber, on the client form): two letters then ten
// digits, spaces ignored, where the last two digits are 97 minus the remainder of the first eight
// divided by 97 (a remainder of 0 gives 97). The client form refuses a number that is not in that
// form or fails the check. A client with a valid tax number, and whose two letters are the region
// they are taxed in, whose region is not the workspace's home region (settings.homeRegion) is
// reverse charged: no tax on any line, the panel shows "Reverse charge", and sending writes
// REVERSE_CHARGE id=<id> number=<number> total=<grand total> after INVOICE_SENT. A number that
// fails the check counts as no number.
test.describe('reverse charge for registered clients', () => {
  test('refuses a tax number that fails its check', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, homeRegion: 'NY' },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Umbrella Co');
    await page.getByTestId('client-form-email').fill('ap@umbrella.example');
    await page.getByTestId('client-form-region').fill('CA');
    // the check digits of 20481630 are 97 - (20481630 mod 97 = 80) = 17, not 71; and a number
    // needs two letters and ten digits
    for (const number of ['CA2048163071', 'CA20481630', '2048163017CA']) {
      await page.getByTestId('client-form-tax-number').fill(number);
      await page.getByTestId('client-form-submit').click();
      await expect(page.getByTestId('client-form-error')).toBeVisible();
      await expect(page.getByTestId('client-row-2')).toHaveCount(0);
    }
    await page.getByTestId('client-form-tax-number').fill('CA 2048 1630 17');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Umbrella Co');
  });

  test('charges no tax to a registered client outside the home region', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, homeRegion: 'NY' },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY', taxNumber: 'NY1234567894' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA',
          taxNumber: 'CA2048163017' },
        { id: 3, name: 'Initech', email: 'ap@initech.example', region: 'CA', taxNumber: 'CA2048163071' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Design', qty: 3, unitPrice: 33.35 },
            { id: 2, description: 'Handbook', qty: 2, unitPrice: 12.5, taxRate: 5 },
          ] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 10,
          lineItems: [
            { id: 3, description: 'Design', qty: 3, unitPrice: 33.35 },
            { id: 4, description: 'Handbook', qty: 2, unitPrice: 12.5, taxRate: 5 },
          ] },
        { id: 3, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Design', qty: 3, unitPrice: 33.35 }] },
      ],
    });
    await page.goto('/');

    // the workspace is in New York; Globex is in California with a valid tax number
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$112.55'); // 125.05 - 12.50, no tax
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=2 number=INV-0000026 total=112.55');
    await expect.poll(() => auditLines()).toContain('REVERSE_CHARGE id=2 number=INV-0000026 total=112.55');
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
    // a valid number in the home region is taxed as usual: 8.875% of 100.05 + 5% of 25.00
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
    await expect(page.getByTestId('invoice-tax')).toHaveText('$10.13');
    // a number that fails its check counts for nothing: California's 7.25% of 100.05
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
    await expect(page.getByTestId('invoice-tax')).toHaveText('$7.25');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$107.30');
  });

  test('a number from another region does not count', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, homeRegion: 'NY' },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'CA', taxNumber: 'NY1234567894' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 3, unitPrice: 33.35 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // a valid New York number for a California client: California's 7.25% of 100.05
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveCount(0);
    await expect(page.getByTestId('invoice-tax')).toHaveText('$7.25');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$107.30');
  });
});
