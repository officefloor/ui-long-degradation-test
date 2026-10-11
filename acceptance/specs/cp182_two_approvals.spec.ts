import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A draft whose grand total is more than twice the approval limit (as converted) needs two
// approvals of the same total (invoices[].approvals counts them; each writes INVOICE_APPROVED): it
// shows "Needs 2 approvals", then "Needs 1 more approval", then "Approved", and can't be sent
// before. A change to the total needs both again.
test.describe('two approvals', () => {
  test('an invoice over twice the limit needs two approvals', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, approvalLimit: 5000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 9100 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 9090.9 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 9,100.00 + 10% = 10,010.00, more than twice the 5,000.00 limit
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 2 approvals');
    await page.getByTestId('invoice-approve').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 1 more approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await page.getByTestId('invoice-approve').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_APPROVED'))).toEqual([
      'INVOICE_APPROVED id=1 total=10010.00',
      'INVOICE_APPROVED id=1 total=10010.00',
    ]);
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    // 9,090.90 + 909.09 = 9,999.99 is not more than twice the limit: one approval
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
  });

  test('a change after two approvals needs both again', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, approvalLimit: 5000 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          approvedTotal: 10010, approvedOn: '2026-03-10', approvals: 2,
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 9100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    await page.getByTestId('line-form-description').fill('Support');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('10');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs 2 approvals');
  });
});
