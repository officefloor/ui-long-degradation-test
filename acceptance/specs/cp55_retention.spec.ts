import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A draft can hold back retention (invoices[].retentionPct, 0 to 20 with up to two decimals, from
// the retention form): that percentage of the grand total, rounded down to the cent, shown on the
// invoice. While held it is not part of the amount due, takes no payments or credit, and never
// makes the invoice Overdue; once everything else is paid the status is Retention held. The Release
// retention button on a sent invoice with nothing else due releases it
// (invoices[].retentionReleasedOn): it is added to the amount due, falls due 30 days later, and
// RETENTION_RELEASED id=<id> amount=<retention> is written; it is refused while anything else is
// due or there is nothing to release. The client's balance includes retention, held or released;
// the overdue amount includes released retention once it is overdue.
test.describe('retention', () => {
  test('holds retention back until it is released', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 333.33 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('retention-form-pct').fill('2.5');
    await page.getByTestId('retention-form-submit').click();
    // 333.33 + 33.33 tax = 366.66; 2.5% = 9.1665, rounded down
    await expect(page.getByTestId('invoice-retention')).toHaveText('$9.16');
    await page.getByTestId('invoice-send').click();
    // 366.66 less the $9.16 held back
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$357.50');
    await page.getByTestId('payment-form-amount').fill('357.50');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Retention held');
    // the balance still includes the retention; none of it is overdue
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$9.16');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');

    await page.getByTestId('invoice-release-retention').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$9.16');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect.poll(() => auditLines()).toContain('RETENTION_RELEASED id=1 amount=9.16');
  });

  test('releases only once the rest is paid, and released retention can fall overdue', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          retentionPct: 10,
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2025-12-01', dueDate: '2025-12-31',
          retentionPct: 10, retentionReleasedOn: '2026-01-15',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2025-12-01', dueDate: '2025-12-31',
          retentionPct: 10,
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-02-10', allocations: [{ invoiceId: 2, amount: 100 }] },
        { id: 2, clientId: 1, amount: 90, date: '2025-12-20', allocations: [{ invoiceId: 3, amount: 90 }] },
        { id: 3, clientId: 1, amount: 90, date: '2025-12-20', allocations: [{ invoiceId: 4, amount: 90 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // invoice 2 still owes 80.00 besides its 20.00 retention
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$80.00');
    await page.getByTestId('invoice-release-retention').click();
    await expect(page.getByTestId('invoice-release-error')).toBeVisible();
    expect(auditLines().filter((l) => l.startsWith('RETENTION_RELEASED'))).toEqual([]);
    // invoice 3's 10.00 was released on 2026-01-15, due 30 days later: more than 7 days ago
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Overdue');
    // invoice 4 is long past its due date, but only its held retention is left
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('Retention held');
    // 80.00 + 20.00 held + 10.00 + 10.00 held; only invoice 3's released 10.00 is overdue
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$120.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$10.00');
  });

  test('refuses a retention outside 0 to 20', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    for (const pct of ['20.01', '-1', '2.555']) {
      await page.getByTestId('retention-form-pct').fill(pct);
      await page.getByTestId('retention-form-submit').click();
      await expect(page.getByTestId('retention-form-error')).toBeVisible();
    }
    await expect(page.getByTestId('invoice-retention')).toHaveText('$0.00');
  });
});
