import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('median', () => {
  test('median of scaled', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures, counted at half in totals. Her scaled is
    // 2400 (thrust 600, drift 0, band A x4). The lower middle of the eight values 0, 60, 80, 300,
    // 360, 600, 900, 2000 is 300; counted, the middle of nine values would be 360.
    // the sheet's own band C multiplier is 3: Cam 200*3 = 600, Dot 120*3 = 360
    // Sol is shared from sheet S9: counted here like anyone (momentum 100, band C x3 -> value 300)
    // a change dated after the anchor does not count yet (Dot's beta 10 from 2026-04-01); Eli's beta was
    // 40 until it became 10 on 2026-02-01
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { C: 3 } },
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 20, gamma: 5, grade: 'MID', state: 'FINAL', active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [
        { personId: 4, field: 'beta', value: 10, from: '2026-04-01' },
        { personId: 5, field: 'beta', value: 10, from: '2026-02-01' },
      ],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 40, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-median-scaled')).toHaveText('300');

    // as of 2026-01-15 Eli's beta is still 40: momentum 320, band B x3 -> 960; the lower middle of
    // 0, 60, 300, 360, 600, 900, 960, 2000 is 360
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-median-scaled')).toHaveText('360');
  });
});
