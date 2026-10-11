import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A draft created by Generate is sent at once, exactly as if I had sent it (the same dates, audit
// lines and use of credit), when nothing would stop it being sent: it needs no approval, the client
// is not on hold, it keeps the client within their credit limit and needs no deposit. Otherwise it
// stays a draft.
test.describe('recurring invoices sent on their own', () => {
  test('sends a generated invoice straight away when nothing stops it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-02',
      settings: { taxRate: 10, approvalLimit: 1000 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-02', dueDate: '2026-02-28', recurring: true,
          lineItems: [
            { id: 1, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-02-01', periodEnd: '2026-02-28' },
          ] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-02-02', dueDate: '2026-02-28', recurring: true,
          lineItems: [
            { id: 2, description: 'Licences', qty: 20, unitPrice: 60, periodStart: '2026-02-01', periodEnd: '2026-02-28' },
          ] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 100, date: '2026-02-20', allocations: [] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-generate').click();
    // March's 450.00 + 10% needs no approval, so it goes out at once and uses the 100.00 of credit
    await expect.poll(() => auditLines()).toContain('INVOICE_GENERATED from=INV-0000018 to=INV-0000034');
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=3 number=INV-0000034 total=495.00');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=3 amount=100.00');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$890.00');
    // 20 licences at 60.00 is over the approval limit: it waits as a draft
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-generate').click();
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-status')).toHaveText('Draft');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT id=4'))).toEqual([]);
  });
});
