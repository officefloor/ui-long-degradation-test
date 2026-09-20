import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The client page shows at-a-glance counts of projects and contacts.
test.describe('client badges', () => {
  test('shows project and contact counts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 1 },
      ],
      contacts: [
        { id: 1, clientId: 1, name: 'Dana Lee', email: 'dana@acme.example', role: 'Billing' },
        { id: 2, clientId: 1, name: 'Sam Ray', email: 'sam@acme.example', role: 'Lead' },
        { id: 3, clientId: 1, name: 'Pat Kim', email: 'pat@acme.example', role: 'Finance' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-jobs-count')).toHaveText('2');
    await expect(page.getByTestId('client-contacts-count')).toHaveText('3');
  });
});
