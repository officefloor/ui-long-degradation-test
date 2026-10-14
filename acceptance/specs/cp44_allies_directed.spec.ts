import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp41, cp42, cp43): allies become one-directional follows. The seed shape changes
// to `follows: [{ from, to }]` (allies[] is gone). A person's allies are now only the people they
// follow; synergy sums only the followed people's thrust; combined follows.
//   follows: Dana->Ravi, Dana->Uma, Uma->Dana
//   allies(followed): Dana [Ravi,Uma], Ravi [], Uma [Dana]
//   synergy: Dana 14+100=114, Ravi 0, Uma 12
//   combined(influence=momentum): Dana 33+114=147, Ravi 8+0=8, Uma 100+12=112
const SEED = {
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, // Dana follows Ravi, Uma
    { from: 3, to: 1 },                     // Uma follows Dana
  ],
};

test.describe('directed allies', () => {
  test('allies are the followed people', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('person-allies')).toHaveText('Ravi, Uma');
    await expect(page.getByTestId('person-row-2').getByTestId('person-allies')).toHaveText('');
    await expect(page.getByTestId('person-row-3').getByTestId('person-allies')).toHaveText('Dana');

    await expect(page.getByTestId('person-row-1').getByTestId('person-ally-count')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('person-ally-count')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('person-ally-count')).toHaveText('1');
  });

  test('synergy and combined follow only the followed people', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-synergy')).toHaveText('114');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-synergy')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-synergy')).toHaveText('12');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-combined')).toHaveText('147');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-combined')).toHaveText('8');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-combined')).toHaveText('112');
  });
});
