import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A person's own figure that depends on "their group" is worked out for each group they are in and
// then averaged, rounded to the nearest whole number (a half rounds up). Their home group is still the one whose name comes first. Group
// members are in REVIEW (a DRAFT member would be left out of the group's figures).
//
// Everyone active with no patrons: effective = momentum (gamma = alpha); scaled = momentum * band
// multiplier. Groups use the members' effective:
//   Ann 100 (scaled 100*3 = 300), Bob 60 (scaled 60), Cyd 150 (scaled 450), Dee 30 (scaled 30)
//   Able: Ann, Bob       -> strength 160, size 2, cohesion 80
//   Bold: Ann, Cyd, Dee  -> strength 280, size 3, cohesion 280/3 = 93.3 -> 93
// Ann, in Able and Bold:
//   share     300*100/160 = 187.5 -> 188 ; 300*100/280 = 107.1 -> 107 ; (188+107)/2 = 147.5 -> 148
//   standing  1 in Able ; 2 in Bold (Cyd 450 first)              ; (1+2)/2 = 1.5 -> 2
//   belonging 160-300 = -140 ; 280-300 = -20                     ; (-140-20)/2 = -80
//   tether    300-80 = 220 ; 300-93 = 207                        ; 427/2 = 213.5 -> 214
//   weave     300+80 = 380 ; 300+93 = 393                        ; 773/2 = 386.5 -> 387
//   mesh      300*2 = 600 ; 300*3 = 900                          ; 750
//   rung      Able 100 ; Bold (3-2)*100/2 = 50                   ; 75
// This sheet multiplies band C by 3 (the rest as usual).
// The anchor is 2026-03-01. Bob's beta becomes 20 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('all their groups', () => {
  test('figures from their group average over every group they are in', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { C: 3 } },
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
      history: [{ personId: 2, field: 'beta', value: 20, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-home-group')).toHaveText('Able');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-share')).toHaveText('148');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing')).toHaveText('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-belonging')).toHaveText('-80');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-tether')).toHaveText('214');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-weave')).toHaveText('387');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-mesh')).toHaveText('750');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rung')).toHaveText('75');
    // someone in one group is unchanged: Cyd in Bold, standing 1, tether 450-93 = 357
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tether')).toHaveText('357');

    // as of 2026-04-01 Bob's change counts: Bob 6*20 = 120, Able strength 220,
    // share 300*100/220 = 136.4 -> 136 ; Bold 107 ; (136+107)/2 = 121.5 -> 122
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-1').getByTestId('concept-share')).toHaveText('122');
  });
});
