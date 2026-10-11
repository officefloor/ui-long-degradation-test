import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A dispute can be resolved with a credit (the Resolve with credit button;
// invoices[].disputeCredit): a credit note is issued today for the disputed lines, each credited in
// full (the whole invoice when it was disputed as a whole), taxed like the original and applied as
// credit notes are (CREDIT_NOTE_ISSUED, then any excess held as credit); the dispute is resolved
// (DISPUTE_RESOLVED). The interest held back on the disputed amount during the dispute is not
// charged; the rest of the invoice is owed as usual.
test.describe('resolving a dispute with a credit', () => {
  test('resolves a dispute by crediting the disputed lines', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          disputedOn: '2026-04-01',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 200, disputed: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$220.00'); // 200.00 + 20.00 tax
    await page.getByTestId('invoice-resolve-credit').click();
    // a credit note for the travel line, taxed like the original, is issued today and the dispute ends
    await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number=CN-0000026 invoice=1 total=220.00');
    await expect.poll(() => auditLines()).toContain('DISPUTE_RESOLVED id=1');
    await expect(page.getByTestId('invoice-credited')).toHaveText('$220.00');
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$0.00');
    // no interest on the credited line for the time it was in dispute: 1,320.00 for 24 days, then the
    // undisputed 1,100.00 for 29
    await expect(page.getByTestId('invoice-interest')).toHaveText('$21.28');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,121.28');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
  });

  test('a credit for a whole disputed invoice leaves what was paid as credit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-05-31',
          disputedOn: '2026-04-20',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 300 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 110, date: '2026-04-10', allocations: [{ invoiceId: 3, amount: 110 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('invoice-resolve-credit').click();
    // the whole invoice was in dispute: all of it is credited (330.00), 220.00 against what it owed and the
    // 110.00 already paid back as credit
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=110.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$110.00');
  });
});
