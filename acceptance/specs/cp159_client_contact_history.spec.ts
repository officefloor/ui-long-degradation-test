import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a client has a history of contacts, shown newest first.
test.describe('client contact history', () => {
  test('lists contact history newest first', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
        contactHistory: [
          { id: 1, date: '2026-01-10', note: 'Kickoff call' },
          { id: 2, date: '2026-02-20', note: 'Follow-up email' },
        ] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    const rows = page.getByTestId(/^contact-history-row-/);
    await expect(rows.nth(0).getByTestId('contact-history-note')).toHaveText('Follow-up email');
    await expect(rows.nth(1).getByTestId('contact-history-note')).toHaveText('Kickoff call');
  });
});
