import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp220 (mutates: [209]): a holiday on a weekend is now observed on the nearest
// weekday, so Globex's 20 business days skip Friday 2026-07-03 for the Saturday 2026-07-04 holiday
// and end on 2026-07-10. Carries both tests.
// The workspace can keep a holiday calendar (settings.holidays, a list of dates, possibly empty).
// With one, days in payment terms are business days, Monday to Friday and not a listed holiday: the
// client's own terms, a region's terms and the cap for risky clients make the due date that many
// business days after the issue date (counting from the next day); grace periods, the early-payment
// window, milestones' terms and how long an approval lasts are counted in business days too. Late
// interest still accrues for every calendar day once the grace period has ended. Without a
// calendar, days are calendar days as before. A listed holiday falling on a Saturday is observed on
// the Friday before, one on a Sunday on the Monday after.
test.describe('a business-day calendar', () => {
  test('terms and grace count business days', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12, holidays: ['2026-06-19', '2026-07-04'] },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', termsDays: 10, graceDays: 3 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', termsDays: 20 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-20', dueDate: '2026-06-03',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-05-22', dueDate: '2026-06-05',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 1000 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-send').click();
    // 10 business days after Wednesday 2026-06-10, skipping two weekends and the 2026-06-19 holiday
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-06-25');
    // due Wednesday 2026-06-03: 3 business days of grace end Monday 2026-06-08, so it is overdue and
    // earns 2 days' interest: 1,100.00 x ((1 + 0.12/360)^2 - 1) = 0.7335 -> 0.73
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.73');
    // due Friday 2026-06-05: grace runs Monday to Wednesday, ending today, so not yet
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,100.73');
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('invoice-send').click();
    // 20 business days: the Saturday holiday, 2026-07-04, is observed on Friday 2026-07-03
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('2026-07-10');
  });

  test('the early-payment window counts business days', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, holidays: [] },
      clients: [
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', earlyPayPct: 2, earlyPayDays: 5 },
      ],
      invoices: [
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-06-03', dueDate: '2026-07-31',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    // issued Wednesday 2026-06-03: 5 business days run to Wednesday 2026-06-10, so the window is still
    // open today (5 calendar days would have closed it on Monday)
    await expect(page.getByTestId('invoice-settle-amount')).toHaveText('$540.00'); // 550.00 - 10.00
    await page.getByTestId('payment-form-amount').fill('540.00');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=4 amount=10.00');
  });
});
