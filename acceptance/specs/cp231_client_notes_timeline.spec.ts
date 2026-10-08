import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a client's notes shown as a timeline, newest first.
test.describe('client notes timeline', () => {
  test('shows notes newest first', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      clientNotes: [
        { id: 1, clientId: 1, text: 'Older note', date: '2026-01-10' },
        { id: 2, clientId: 1, text: 'Newer note', date: '2026-02-10' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId(/^note-row-/).first().getByTestId('note-text')).toHaveText('Newer note');
  });
});
