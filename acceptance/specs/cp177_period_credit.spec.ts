import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Crediting a line with a service period copies the period onto the credit line, and the credit
// line's period can be shortened (with the line form's period boxes) to credit just part of it,
// charged by the day like any period. A credit period that is not inside the period the line billed
// is refused.
test.describe('crediting part of a period', () => {
  test('credits part of a service period by the day', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-11', dueDate: '2026-03-31',
          lineItems: [
            { id: 1, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-01-20', periodEnd: '2026-02-10' },
            { id: 2, description: 'Setup', qty: 1, unitPrice: 120 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-row-1').getByTestId('line-credit').click();
    // the credit line copies the period: all of it would credit the whole charge
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('line-row-3').getByTestId('line-period')).toHaveText('2026-01-20 to 2026-02-10');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$325.48');
    // a period reaching outside the one billed is refused
    await page.getByTestId('line-row-3').getByTestId('line-edit').click();
    await page.getByTestId('line-form-period-start').fill('2026-02-01');
    await page.getByTestId('line-form-period-end').fill('2026-02-15');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    // crediting 2026-02-01 to 2026-02-10: 10 days at 450 x 12 / 365 = 147.95, plus 10% tax like the original
    await page.getByTestId('line-row-3').getByTestId('line-edit').click();
    await page.getByTestId('line-form-period-start').fill('2026-02-01');
    await page.getByTestId('line-form-period-end').fill('2026-02-10');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$147.95');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$162.75');
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=2 number=CN-0000026 invoice=1 total=162.75');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-credited')).toHaveText('$162.75');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$327.28');
  });
});
