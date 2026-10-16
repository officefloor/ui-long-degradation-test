import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Dated links. A patron link or a follow may carry a start date, seeded as `since` on
// `patrons: [{ personId, patronId, since }]` and `follows: [{ from, to, since }]`; no `since` means the
// link has always been there. A link counts on a date only if it starts ON OR BEFORE that date: the
// as-of date when one is chosen, otherwise the anchor (2026-03-01). Every figure that combines a
// person's patrons or the people they follow uses only the links that count, and the linked people's
// numbers as of the same date. A person none of whose patrons count is treated as having none
// (backing n/a, clout 0). The patron and follow lists still show every link, whatever its date.
// Hela is on hold: left out of every patron and follow figure and of sheet-wide counts.
// All active, no scores, so effective = net and adjusted = effective + clout + synergy.
//
//   people: Ada a3 b4 g10 (thrust 12, momentum 33) ; Ben a7 b2 g5, beta 4 from 2026-02-10
//           (now thrust 28, momentum 28 + 3*(-2) = 22 ; on 2026-02-01 thrust 14, momentum 8) ;
//           Cy a5 b20 g5 (thrust 100, momentum 100) ; Dot a2 b5 g2 (thrust 10, momentum 10) ;
//           Hela a10 b10 g10, on hold (thrust 100) ; Sol a2 b5 g2 (thrust 10, momentum 10)
//   patrons: Ada <- Ben (always), Cy (from 2026-02-15), Hela (always, held)
//            Dot <- Ben (from 2026-02-01), Cy (from 2026-04-01, after the anchor), Sol (always)
//   follows: Ben -> Cy (from 2026-02-15), Ben -> Hela (always, held)
//
//   now:  Ada backing 28+100=128, clout (22+100)/2=61, net 33+128=161, adjusted 161+61=222 (C)
//         Ben backing n/a, net 22, synergy 100, adjusted 22+100=122 (C)
//         Cy  synergy 28 (followed by Ben), adjusted 100+28=128 (C) ; Dot backing 28+10=38, clout (22+10)/2=16, net 10+38=48,
//         adjusted 48+16=64 (D) ; Sol adjusted 10 (D)
//         band counts C 3, D 2 (Hela, adjusted 100, is not counted)
//   as of 2026-02-01:
//         Ada backing 14, clout 8, net 33+14=47, adjusted 55 (D)
//         Ben net 8, synergy 0, adjusted 8 (D)
//         Cy  adjusted 100 (C, Ben's follow not started) ; Dot backing 14+10=24 (Ben's link starts that day), clout (8+10)/2=9,
//         net 10+24=34, adjusted 43 (D) ; Sol 10 (D)
//         band counts C 1, D 4

test.describe('linked history', () => {
  test('links count from their start date, now and as of a date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ada',  alpha: 3,  beta: 4,  gamma: 10, active: true },
        { id: 2, name: 'Ben',  alpha: 7,  beta: 2,  gamma: 5,  active: true },
        { id: 3, name: 'Cy',   alpha: 5,  beta: 20, gamma: 5,  active: true },
        { id: 4, name: 'Dot',  alpha: 2,  beta: 5,  gamma: 2,  active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, active: true, hold: true },
      ],
      history: [
        { personId: 2, field: 'beta', value: 4, from: '2026-02-10' },
      ],
      patrons: [
        { personId: 1, patronId: 2 },
        { personId: 1, patronId: 3, since: '2026-02-15' },
        { personId: 1, patronId: 9 },
        { personId: 4, patronId: 2, since: '2026-02-01' },
        { personId: 4, patronId: 3, since: '2026-04-01' },
        { personId: 4, patronId: 8 },
      ],
      follows: [
        { from: 2, to: 3, since: '2026-02-15' },
        { from: 2, to: 9 },
      ],
      // Sol is shared from sheet S9 as row 8: counted here like anyone, and is Dot's patron (always)
      sheets: [{ id: 'S9', people: [
        { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, active: true },
      ] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');
    const row = (id: number) => page.getByTestId(`person-row-${id}`);

    await expect(row(4).getByTestId('person-patrons')).toHaveText('Ben, Cy, Sol');
    await expect(row(1).getByTestId('concept-backing')).toHaveText('128');
    await expect(row(1).getByTestId('concept-clout')).toHaveText('61');
    await expect(row(1).getByTestId('concept-net')).toHaveText('161');
    await expect(row(2).getByTestId('concept-synergy')).toHaveText('100');
    await expect(row(4).getByTestId('concept-backing')).toHaveText('38');
    await expect(row(4).getByTestId('concept-clout')).toHaveText('16');
    await expect(row(4).getByTestId('concept-net')).toHaveText('48');
    await expect(page.getByTestId('band-count-C')).toHaveText('3');
    await expect(page.getByTestId('band-count-D')).toHaveText('2');

    await page.getByTestId('sheet-as-of').fill('2026-02-01');
    await page.getByTestId('sheet-as-of-apply').click();

    await expect(row(4).getByTestId('person-patrons')).toHaveText('Ben, Cy, Sol');
    await expect(row(1).getByTestId('concept-backing')).toHaveText('14');
    await expect(row(1).getByTestId('concept-clout')).toHaveText('8');
    await expect(row(1).getByTestId('concept-net')).toHaveText('47');
    await expect(row(2).getByTestId('concept-synergy')).toHaveText('0');
    await expect(row(4).getByTestId('concept-backing')).toHaveText('24');
    await expect(row(4).getByTestId('concept-clout')).toHaveText('9');
    await expect(row(4).getByTestId('concept-net')).toHaveText('34');
    await expect(page.getByTestId('band-count-C')).toHaveText('1');
    await expect(page.getByTestId('band-count-D')).toHaveText('4');

    await page.getByTestId('sheet-as-of-clear').click();
    await expect(row(1).getByTestId('concept-backing')).toHaveText('128');
    await expect(row(4).getByTestId('concept-net')).toHaveText('48');
  });
});
