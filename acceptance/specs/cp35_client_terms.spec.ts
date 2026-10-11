import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have payment terms in days (clients[].termsDays, entered when adding the client). For
// such a client an invoice is due that many days after its issue date, instead of at the end of the
// following month, whether it is created, sent or duplicated.
test.describe('client payment terms', () => {
  test("uses a client's own terms for new invoices", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', termsDays: 14 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Audit', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-new').click();
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('2026-03-24'); // 2026-03-10 + 14 days
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('2026-04-30'); // no terms: end of April
  });

  test("sending uses the client's terms", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', termsDays: 14 }],
      invoices: [
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 10 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-issue')).toHaveText('2026-03-10');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-due')).toHaveText('2026-03-24'); // + 14 days
  });

  test('sets terms when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('ap@initech.example');
    await page.getByTestId('client-form-terms').fill('7');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-new').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-03-17'); // 2026-03-10 + 7 days
  });
});
