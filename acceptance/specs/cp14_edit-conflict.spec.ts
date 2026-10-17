import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.describe("edit conflict", () => {
  test("edit conflict", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    await ui.editOpen(pg_uma, p_ada);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await ui.editOpen(pg_vic, p_ada);
    expect(await ui.editSave(pg_vic, {"grade": "B"})).toBe(true);
    expect(await ui.editSave(pg_uma, {"grade": "C"})).toBe(false);
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "C"})).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaimTwice(pg_uma, p_ada, {"amount": "5.00", "date": "2026-03-01", "note": "once"}));
    expect(await ui.claimCount(pg_uma, p_ada)).toBe(1);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("once");
    ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `PERSON_EDITED sheet=${sheet} by=vic name=Ada grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=5.00 date=2026-03-01`
    ]);
  });
});
