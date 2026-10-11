import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Sending an invoice billed by milestones uses no credit (nothing is owed yet), and a deposit held
// for it stays held for it. Each time one of its milestones is reached, the deposits held for the
// invoice are used on it first (oldest first), then the client's other credit, as when an invoice
// is sent.
test.describe('deposits on milestones', () => {
  test('a deposit for a milestone invoice waits for its milestones', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          milestones: [{ id: 1, description: 'Start', pct: 50 }, { id: 2, description: 'Finish', pct: 50 }],
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 2000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 600, date: '2026-03-02', allocations: [], reference: 'INV-0000018' },
        { id: 2, clientId: 1, amount: 100, date: '2026-03-05', allocations: [] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-send').click();
    // nothing is owed on sending, so the 600.00 deposit held for it and the 100.00 of credit stay put
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Awaiting milestone');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$700.00');
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
    // reaching the first milestone (1,000.00) uses the deposit held for the invoice first, then other credit
    await page.getByTestId('milestone-row-1').getByTestId('milestone-reach').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=600.00',
      'PAYMENT_RECORDED id=2 invoice=1 amount=100.00',
    ]);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$300.00');
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-status')).toHaveText('Part paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$0.00');
  });
});
