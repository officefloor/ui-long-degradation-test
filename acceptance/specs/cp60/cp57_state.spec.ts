import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// State workflow: each person starts at DRAFT and moves forward DRAFT -> REVIEW -> FINAL via
// `person-advance-<id>`, each change writing STATE_CHANGED id=<id> from=<old> to=<new>. At FINAL
// there is no forward advance, but a rework control is present.
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

    await expect.poll(() => auditLines()).toContain('STATE_CHANGED id=1 from=DRAFT to=REVIEW');
    await expect.poll(() => auditLines()).toContain('STATE_CHANGED id=1 from=REVIEW to=FINAL');
  });
});
