import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Part of the retention can be released: an amount entered with the Release retention button (empty
// releases all that is held). What has been released (invoices[].retentionReleasedAmount) becomes
// due 30 days after the latest release; the rest stays held. The panel shows the retention still
// held, and RETENTION_RELEASED shows the amount released. An amount of zero or less, with more than
// two decimals, or more than is held is refused.
test.describe('release part of the retention', () => {
  test('releases part of the retention', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          retentionPct: 10,
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 900, date: '2026-02-20', allocations: [{ invoiceId: 1, amount: 900 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Retention held');
    await page.getByTestId('retention-release-amount').fill('40');
    await page.getByTestId('invoice-release-retention').click();
    // 40.00 of the 100.00 is released and due; 60.00 stays held
    await expect.poll(() => auditLines()).toContain('RETENTION_RELEASED id=1 amount=40.00');
    await expect(page.getByTestId('invoice-retention')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-retention-held')).toHaveText('$60.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$100.00'); // 40.00 + 60.00
  });

  test('refuses to release more than is still held', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          retentionPct: 10, retentionReleasedOn: '2026-03-01', retentionReleasedAmount: 30,
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 930, date: '2026-02-20', allocations: [{ invoiceId: 2, amount: 930 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // 30.00 of the 100.00 was released (and has been paid); 70.00 is still held
    await expect(page.getByTestId('invoice-retention-held')).toHaveText('$70.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Retention held');
    for (const amount of ['70.01', '0', '10.005']) {
      await page.getByTestId('retention-release-amount').fill(amount);
      await page.getByTestId('invoice-release-retention').click();
      await expect(page.getByTestId('invoice-release-error')).toBeVisible();
    }
    await expect(page.getByTestId('invoice-retention-held')).toHaveText('$70.00');
    expect(auditLines().filter((l) => l.startsWith('RETENTION_RELEASED'))).toEqual([]);
  });
});
