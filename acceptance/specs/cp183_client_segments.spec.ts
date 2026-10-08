import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): clients can be grouped into segments, with a count per segment.
test.describe('client segments', () => {
  test('counts clients in each segment', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@ex.example', segment: 'VIP' },
        { id: 2, name: 'Globex', email: 'b@ex.example', segment: 'VIP' },
        { id: 3, name: 'Initech', email: 'c@ex.example', segment: 'Standard' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-segments-open').click();

    await expect(page.getByTestId('segment-row-VIP').getByTestId('segment-count')).toHaveText('2');
    await expect(page.getByTestId('segment-row-Standard').getByTestId('segment-count')).toHaveText('1');
  });
});
