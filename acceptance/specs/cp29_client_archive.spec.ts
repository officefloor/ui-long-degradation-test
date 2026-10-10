import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Clients can be tucked away (archived): they drop off the list and search but are retained, and
// archiving records an audit line.
test.describe('archive a client', () => {
  test('archiving hides the client but keeps it', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
        { id: 3, name: 'Initech', email: 'hello@initech.example', archived: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    // A client that is already archived starts off the list.
    await expect(page.getByTestId('client-row-2')).toBeVisible();
    await expect(page.getByTestId('client-row-3')).toHaveCount(0);

    await page.getByTestId('client-archive-1').click();
    await expect(page.getByTestId('client-row-1')).toHaveCount(0);
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(1);
    expect(auditLines()).toContain('CLIENT_ARCHIVED id=1');
  });
});
