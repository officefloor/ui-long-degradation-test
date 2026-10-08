import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a contact can be archived, keeping the record but dropping it from
// the active contact list.
test.describe('archive contact', () => {
  test('archives a contact off the active list', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
        contacts: [
          { id: 1, name: 'Dana Lee', email: 'dana@acme.example', role: 'Ops' },
          { id: 2, name: 'Sam Okoro', email: 'sam@acme.example', role: 'Finance' },
        ] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId(/^contact-row-/)).toHaveCount(2);
    await page.getByTestId('contact-archive-1').click();
    await expect(page.getByTestId(/^contact-row-/)).toHaveCount(1);
  });
});
