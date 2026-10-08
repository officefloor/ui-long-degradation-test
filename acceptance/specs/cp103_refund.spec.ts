import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A client's unused credit or deposit can be refunded back to them. The refund is recorded and
// their available credit drops.
test.describe('refund', () => {
  test('refunding reduces available credit', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      deposits: [{ id: 1, clientId: 1, amount: 200, date: '2026-01-15' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await page.getByTestId('refund-form-amount').fill('50');
    await page.getByTestId('refund-form-submit').click();

    await expect(page.getByTestId('client-available-credit')).toHaveText('$150.00');
    expect(auditLines()).toContain('REFUND_ISSUED client=1 amount=50.00');
  });
});
