import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice still overdue after its final notice went out counts in its client's risk score as if
// it were paid today, with its days late so far, with everything the score drives.
test.describe('unpaid final notices and risk', () => {
  test('an unpaid final notice counts in the risk score as if paid today', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12, approvalLimit: 5000 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example' }],
      invoices: [
        { id: 1, clientId: 2, status: 'SENT', issueDate: '2026-03-21', dueDate: '2026-04-21',
          reminders: ['2026-05-01', '2026-05-15', '2026-06-01'],
          lineItems: [{ id: 1, description: 'Audit', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-05',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 2, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    // nothing paid yet, but the final notice is unpaid 50 days after the due date: a score of 50.0
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-score')).toHaveText('50.0');
    await expect(page.getByTestId('client-row-2').getByTestId('client-risk-band')).toHaveText('HIGH');
    await page.getByTestId('client-row-2').click();
    // so its other invoice has no grace and 3 points more interest: 15% from 2026-06-05
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$2.29');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 2 approvals');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
  });
});
