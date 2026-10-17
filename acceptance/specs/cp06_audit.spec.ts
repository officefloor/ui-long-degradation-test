import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.describe("audit", () => {
  test("audit", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "B"})).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "5.00", "date": "2026-03-02", "note": "n"}));
    expect(await ui.addClaim(pg_uma, p_ada, {"amount": "1.005"})).toBeNull();
    expect(await ui.editClaim(pg_uma, c_ada_0, {"amount": "6.00", "note": "m"})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"})).toBeNull();
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("6.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("m");
    ui.expectAudit(sheet, [
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=5.00 date=2026-03-02`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ada amount=6.00 date=2026-03-02`
    ]);
  });
});
