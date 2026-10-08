import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED dashboard-overdue spec (carries the count and fee-inclusive amount forward, adds the
// bucketed breakdown by how overdue each invoice is, measured against the reference date).
test.describe('dashboard overdue', () => {
  test('counts sent invoices past their due date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-02-01' },
        { id: 2, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-02-15' },
        { id: 3, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-04-01' },
        { id: 4, projectId: 1, amount: 100, status: 'DRAFT', dueDate: '2026-01-01' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-overdue-count')).toHaveText('2');
  });

  test('overdue amount includes accrued late fees', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-19', lateFeePerDay: 1, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-overdue-amount')).toHaveText('$110.00');
  });

  test('splits the overdue amount into age buckets', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-02-25' }, // 4 days overdue
        { id: 2, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-01-20' }, // 40 days overdue
        { id: 3, projectId: 1, amount: 100, status: 'SENT', dueDate: '2025-12-01' }, // 90 days overdue
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-overdue-0-30')).toHaveText('$100.00');
    await expect(page.getByTestId('dashboard-overdue-31-60')).toHaveText('$100.00');
    await expect(page.getByTestId('dashboard-overdue-60-plus')).toHaveText('$100.00');
  });
});
