import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a client's contact details can be exported to a simple file; the
// generated content is shown for confirmation.
test.describe('client export', () => {
  test('exports a client\'s contact details', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', phone: '+1 555 0100' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-export').click();

    await expect(page.getByTestId('client-export-output')).toContainText('ops@acme.example');
  });
});
