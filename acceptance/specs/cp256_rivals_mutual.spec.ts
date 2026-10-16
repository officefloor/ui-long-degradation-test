import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Rivalry is now MUTUAL: if one person names another a rival, each is the other's rival.
// Ada named Ben and Cam. So Ben and Cam now also count Ada as a rival.
// ripple = cascade + rivals' influence. cascade: Ada 310, Ben 310, Cam 1400, Dot 310.
// influence: Ada 60, Ben 120, Cam 300. Ada: 310 + 120 + 300 = 730. Ben: 310 + 60 = 370.
// Cam: 1400 + 60 = 1460. Dot has no rival either way: 310.

test.describe('rivalry is mutual', () => {
  test('counts a rival named in either direction', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true },
        { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true },
        { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // held
      ],
      rivals: [{ from: 1, to: 2 }, { from: 1, to: 3 }], // Ada <-> Ben, Ada <-> Cam
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-ripple')).toHaveText('730');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-ripple')).toHaveText('370');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-ripple')).toHaveText('1460');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-ripple')).toHaveText('310');
  });
});
