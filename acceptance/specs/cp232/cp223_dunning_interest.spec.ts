import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp232 (mutates: [179, 223]): the region's maximum now caps only the usual rate, so in
// New York the final notice takes 12% to 14% rather than being held at 13%. Carries the test.
// From the day an invoice's final notice goes out its late interest rate is 2 percentage points
// higher, on top of any rise for a high-risk client; the region's legal maximum caps only the usual
// rate, with the rises added on top. From the day its collections notice goes out it earns no more
// late interest.
test.describe('chasing and late interest', () => {
  test('a final notice raises the interest rate and collections stops it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12, regionMaxInterest: { NY: 13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'NY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          reminders: ['2026-04-10', '2026-05-01', '2026-05-20'],
          lineItems: [{ id: 1, description: 'Audit', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          reminders: ['2026-03-10', '2026-04-01', '2026-04-20', '2026-05-15'],
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          reminders: ['2026-04-10', '2026-05-01', '2026-05-20'],
          lineItems: [{ id: 3, description: 'Audit', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // 1,100.00 at 12% from the end of grace (2026-04-08) to the final notice on 2026-05-20, then 14%
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$24.53');
    // handed to collections on 2026-05-15: interest stopped that day
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-dunning')).toHaveText('COLLECTIONS');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$26.62');
    // in New York the 13% maximum caps only the usual 12%, so the final notice still makes it 14%
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$24.53');
  });
});
