import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A person's own figure that depends on "their group" is worked out for each group they are in and
// then averaged, rounded down. Their home group is still the one whose name comes first. Group
// members are in REVIEW (a DRAFT member would be left out of the group's figures).
//
// Everyone active with no patrons: effective = momentum (gamma = alpha); scaled = momentum * band
// multiplier, and this sheet multiplies band C by 3. Groups use the members' effective:
//   Ann 100 (scaled 300), Bob 60 (scaled 60), Cyd 150 (scaled 450), Dee 30 (scaled 30)
//   Able: Ann, Bob       -> strength 160, size 2, cohesion 80
//   Bold: Ann, Cyd, Dee  -> strength 280, size 3, cohesion 280/3 = 93
// Ann, in Able and Bold:
//   share     300*100/160 = 187.5 -> 188 (to nearest) ; 300*100/280 = 107.1 -> 107 ; average (188+107)/2 = 147.5 -> 147
//   standing  1 in Able ; 2 in Bold (Cyd 450 first)              ; (1+2)/2 = 1.5 -> 1
//   belonging 160-300 = -140 ; 280-300 = -20                     ; (-140-20)/2 = -80
//   tether    300-80 = 220 ; 300-93 = 207                        ; 427/2 = 213
//   weave     300+80 = 380 ; 300+93 = 393                        ; 773/2 = 386
//   mesh      300*2 = 600 ; 300*3 = 900                          ; 750
//   rung      Able 100 ; Bold (3-2)*100/2 = 50                   ; 75
test.describe('all their groups', () => {
  test('figures from their group average over every group they are in', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      // the sheet's own band multipliers: C is x3 here, not x2
      settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 } },
      anchor: '2026-03-01',
      // Dee's beta change to 50 is dated after the anchor: it does not count yet
      history: [
        { personId: 4, field: 'beta', value: 50, from: '2026-04-01' },
      ],
      groups: [{ id: 1, name: 'Able' }, { id: 2, name: 'Bold' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, state: 'REVIEW' },
        { id: 2, name: 'Bob', alpha: 6, beta: 10, gamma: 6, active: true, state: 'REVIEW' },
        { id: 3, name: 'Cyd', alpha: 5, beta: 30, gamma: 5, active: true, state: 'REVIEW' },
        { id: 4, name: 'Dee', alpha: 3, beta: 10, gamma: 3, active: true, state: 'REVIEW' },
      ],
      memberships: [
        { personId: 1, groupId: 1 }, { personId: 1, groupId: 2 },
        { personId: 2, groupId: 1 },
        { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-home-group')).toHaveText('Able');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-share')).toHaveText('147');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing')).toHaveText('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-belonging')).toHaveText('-80');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-tether')).toHaveText('213');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-weave')).toHaveText('386');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-mesh')).toHaveText('750');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rung')).toHaveText('75');
    // someone in one group is unchanged: Cyd in Bold, standing 1, tether 450-93 = 357
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tether')).toHaveText('357');
  });
});
