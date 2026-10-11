import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An unpaid instalment that is not yet overdue and not the last can be skipped
// (invoices[].skippedInstalment): it pays only its interest, its principal stays owed, and the
// instalments after it are worked out again by the plan's rule on that balance over the instalments
// left, keeping their due dates. INSTALMENT_SKIPPED id=<invoice id> instalment=<number> is written.
// Skipping an overdue, paid or last instalment is refused.
test.describe('instalment holiday', () => {
  test('skips an instalment and spreads it over the rest', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-15',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('instalment-row-1').getByTestId('instalment-skip').click();
    await expect.poll(() => auditLines()).toContain('INSTALMENT_SKIPPED id=1 instalment=1');
    // instalment 1 pays only its interest (1,000.00 x 0.01 = 10.00); the 1,000.00 is re-spread over
    // the 2 left: 1,000.00 x 0.01 / (1 - 1.01^-2) = 507.51, rounded up to 508.00
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('2026-02-28');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$10.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-interest')).toHaveText('$10.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-principal')).toHaveText('$0.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-balance')).toHaveText('$1,000.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-due')).toHaveText('2026-03-31');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('$508.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-interest')).toHaveText('$10.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-principal')).toHaveText('$498.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-balance')).toHaveText('$502.00');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('2026-04-30');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('$507.02');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-interest')).toHaveText('$5.02');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-principal')).toHaveText('$502.00');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-balance')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$1,025.02');
  });

  test('refuses to skip an overdue or the last instalment', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-31', dueDate: '2026-04-30', instalments: 3,
          instalmentRate: 12, skippedInstalment: 1,
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // instalment 1 (due 2026-02-28) is overdue; instalment 3 is the last
    for (const k of [1, 3]) {
      await page.getByTestId(`instalment-row-${k}`).getByTestId('instalment-skip').click();
      await expect(page.getByTestId('instalment-skip-error')).toBeVisible();
    }
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$1,020.04');
    expect(auditLines().filter((l) => l.startsWith('INSTALMENT_SKIPPED'))).toEqual([]);
    // invoice 3 already skipped instalment 1: it pays only its interest, and 2 and 3 are re-spread
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-principal')).toHaveText('$0.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$10.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('$508.00');
  });
});
