import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A shared person's links belong to each sheet. Each sheet's `patrons` and `follows` (seeded inside
// that sheet, keyed by the person's id on that sheet) are theirs on that sheet only, so backing,
// clout, net and synergy can differ from sheet to sheet. On each sheet they can also be someone's
// patron there, with their shared numbers.
//
// Dana is S1 person 1 and shows on S2 as person 5.
//   S1: Dana's patron Ravi (thrust 14, effective 8); Dana follows Uma (thrust 100).
//   S2: Dana's patrons Kai (thrust 6, effective 15) and Hela; Dana follows Lee (thrust 20) and Hela.
//       Lee's patron is Dana.
// Hela is on hold: left out of every figure over a person's patrons or follows (and of sheet-wide
// figures). Counting her would give Dana backing 6 + 36 = 42, clout (15 + 36) / 2 = 25 and synergy
// 20 + 36 = 56 on S2.
test.describe('links per sheet', () => {
  test('a shared person has their own patrons and follows on each sheet', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1',
          people: [
            { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true }, // thrust 12, momentum 33
            { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true }, // thrust 14, momentum 8
            { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true }, // thrust 100, momentum 100
          ],
          patrons: [{ personId: 1, patronId: 2 }],
          follows: [{ from: 1, to: 3 }] },
        { id: 'S2',
          people: [
            { id: 1, name: 'Kai',  alpha: 2, beta: 3, gamma: 5, active: true },             // thrust 6, momentum 6 + 9 = 15
            { id: 2, name: 'Lee',  alpha: 4, beta: 5, gamma: 4, active: true },             // thrust 20, momentum 20
            { id: 9, name: 'Hela', alpha: 6, beta: 6, gamma: 6, active: true, hold: true }, // thrust 36, momentum 36, held
          ],
          patrons: [{ personId: 5, patronId: 1 }, { personId: 5, patronId: 9 }, { personId: 2, patronId: 5 }],
          follows: [{ from: 5, to: 2 }, { from: 5, to: 9 }] },
      ],
      shares: [{ sheetId: 'S2', personId: 5, fromSheetId: 'S1', fromPersonId: 1 }],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();

    const s1Dana = page.getByTestId('person-row-1');
    await expect(s1Dana.getByTestId('person-patrons')).toHaveText('Ravi');
    await expect(s1Dana.getByTestId('concept-backing')).toHaveText('14'); // Ravi's thrust
    await expect(s1Dana.getByTestId('concept-net')).toHaveText('47');     // 33 + 14
    await expect(s1Dana.getByTestId('concept-clout')).toHaveText('8');    // Ravi's effective 8 / 1
    await expect(s1Dana.getByTestId('concept-synergy')).toHaveText('100'); // Uma's thrust

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    const s2Dana = page.getByTestId('person-row-5');
    await expect(s2Dana.getByTestId('concept-backing')).toHaveText('6');   // Kai's thrust (Hela held)
    await expect(s2Dana.getByTestId('concept-net')).toHaveText('39');      // 33 + 6
    await expect(s2Dana.getByTestId('concept-clout')).toHaveText('15');    // Kai's effective 15 / 1
    await expect(s2Dana.getByTestId('concept-synergy')).toHaveText('20');  // Lee's thrust (Hela held)

    // Lee's patron is Dana: backing is her thrust, clout her effective on this sheet (her net here, 39)
    const lee = page.getByTestId('person-row-2');
    await expect(lee.getByTestId('concept-backing')).toHaveText('12');
    await expect(lee.getByTestId('concept-clout')).toHaveText('39');
  });

  test('a shared person\'s numbers feed the links on every sheet', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1',
          people: [
            { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
            { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true },
            { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
          ],
          patrons: [{ personId: 1, patronId: 2 }],
          follows: [{ from: 1, to: 3 }] },
        { id: 'S2',
          people: [
            { id: 1, name: 'Kai',  alpha: 2, beta: 3, gamma: 5, active: true },
            { id: 2, name: 'Lee',  alpha: 4, beta: 5, gamma: 4, active: true },
            { id: 9, name: 'Hela', alpha: 6, beta: 6, gamma: 6, active: true, hold: true },
          ],
          patrons: [{ personId: 5, patronId: 1 }, { personId: 5, patronId: 9 }, { personId: 2, patronId: 5 }],
          follows: [{ from: 5, to: 2 }, { from: 5, to: 9 }] },
      ],
      shares: [{ sheetId: 'S2', personId: 5, fromSheetId: 'S1', fromPersonId: 1 }],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('sheet-current-id')).toHaveText('S1');

    // Dana alpha 8 -> thrust 32, drift 10-8 = 2, momentum 32 + 6 = 38
    await page.getByTestId('person-edit-1').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Dana');
    await page.getByTestId('person-form-alpha').fill('8');
    await page.getByTestId('person-form-submit').click();
    await expect(page.getByTestId('person-row-1').getByTestId('concept-net')).toHaveText('52'); // 38 + 14

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    const s2Dana = page.getByTestId('person-row-5');
    await expect(s2Dana.getByTestId('concept-backing')).toHaveText('6');  // still only Kai
    await expect(s2Dana.getByTestId('concept-net')).toHaveText('44');     // 38 + 6
    const lee = page.getByTestId('person-row-2');
    await expect(lee.getByTestId('concept-backing')).toHaveText('32');    // Dana's new thrust
    await expect(lee.getByTestId('concept-clout')).toHaveText('44');      // Dana's effective here
    await expect(lee.getByTestId('concept-net')).toHaveText('52');        // 20 + 32
  });
});
