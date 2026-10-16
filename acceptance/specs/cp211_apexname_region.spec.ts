import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('apex by region', () => {
  test('top name per region', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures: she is never a top name.
    // S2 without her: Cam 400 beats Dot 240 -> Cam (Hela's 753 would win if she counted).
    // Sol is shared from sheet S9, where she is in region E3: counted here like anyone
    // (momentum 3 x 30 = 90, band D -> 90), so she beats Eli 80 in E3.
    // A change dated after the anchor does not count yet (Ada's beta 20 from 2026-04-01 would make her
    // 200 x 2 = 400, below Ben's 900).
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 30, gamma: 3, grade: 'LOW', state: 'DRAFT', active: true },
        ], regions: [{ personId: 1, region: 'E3' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'beta', value: 20, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 1, beta: 251, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 251 -> band B x3 -> scaled 753, half 376
      ],
      regions: [
        { personId: 1, region: 'N1' },
        { personId: 2, region: 'N1' },
        { personId: 3, region: 'S2' },
        { personId: 4, region: 'S2' },
        { personId: 5, region: 'E3' },
        { personId: 6, region: 'E3' },
        { personId: 7, region: 'E3' },
        { personId: 9, region: 'S2' },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('apexname-region-N1')).toHaveText('Ada');
    await expect(page.getByTestId('apexname-region-S2')).toHaveText('Cam');
    await expect(page.getByTestId('apexname-region-E3')).toHaveText('Sol');

    // as of 2026-04-01 Ada's change counts: momentum 200, band C -> 400, so Ben's 900 tops N1
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('apexname-region-N1')).toHaveText('Ben');
  });

  // Within region N1, Bob and Cat are level at the top value (scaled 2000), so the region's top names
  // both, joined by ", " in alphabetical order. Ace is in N1 but lower (scaled 900).
  // Hela (scaled 2400) is in N1 but on hold, so she is never the apex.
  // Sol is shared from sheet S9, where she is in region N1: counted here like anyone (scaled 2000),
  // so she is level with Bob and Cat.
  test('region top names everyone level at the top', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
        ], regions: [{ personId: 1, region: 'N1' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Ace', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 300 -> band B x3 -> scaled 900
        { id: 2, name: 'Cat', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
        { id: 3, name: 'Bob', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true }, // momentum 600 -> band A x4 -> scaled 2400
      ],
      regions: [
        { personId: 1, region: 'N1' },
        { personId: 2, region: 'N1' },
        { personId: 3, region: 'N1' },
        { personId: 9, region: 'N1' },
      ],
    });
    await page.goto('/');
    // N1 top value 2000: Bob, Cat and Sol (Ace 900 is below)
    await expect(page.getByTestId('apexname-region-N1')).toHaveText('Bob, Cat, Sol');
  });
});
