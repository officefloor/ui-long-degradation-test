import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';
import { auditLines } from '../../support/audit';

// audit are unchanged. FINAL is no longer terminal: there is no forward advance, but a rework
// control is now present (cp57 had asserted it did not exist).
test.describe('state workflow', () => {
  test('advances DRAFT -> REVIEW -> FINAL with audit; FINAL offers rework', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [{ id: 1, name: 'Al', alpha: 5, beta: 20, gamma: 5, state: 'DRAFT' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('DRAFT');

    await page.getByTestId('person-advance-1').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('REVIEW');

    await page.getByTestId('person-advance-1').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');

    // no forward advance at FINAL, but rework is now available
    await expect(page.getByTestId('person-advance-1')).toBeHidden();
    await expect(page.getByTestId('person-rework-1')).toBeVisible();

    const lines = auditLines();
    expect(lines).toContain('STATE_CHANGED id=1 from=DRAFT to=REVIEW');
    expect(lines).toContain('STATE_CHANGED id=1 from=REVIEW to=FINAL');
  });
});
