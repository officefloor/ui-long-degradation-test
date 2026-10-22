import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("rollover undo", () => {
  test("rollover undo", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-12-20");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    expect(await ui.generateFy(pg_uma, "2026")).toBe(12);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00", "date": "2026-12-05"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.rollover(pg_vic, "2026")).toBe(12);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-01-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-02-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-03-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-04-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-05-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-06-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-07-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-08-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-09-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-10-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-11-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-12-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-locked")).toHaveText("no");
    expect(await ui.rolloverUndo(pg_vic)).toBe(true);
    expect(await ui.rolloverUndo(pg_vic)).toBe(false);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-locked")).toHaveText("no");
    expect(await ui.rollover(pg_vic, "2026")).toBe(12);
    await ui.refresh(pg_uma);
    expect(await ui.rolloverUndo(pg_uma)).toBe(false);
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "1.00", "date": "2027-01-05"}));
    await ui.refresh(pg_vic);
    expect(await ui.rolloverUndo(pg_vic)).toBe(false);
    expect(await ui.claimAction(pg_vic, c_ada_1, "void")).toBe(true);
    expect(await ui.rolloverUndo(pg_vic)).toBe(false);
    await ui.setToday(pg_vic, "2026-12-21");
    expect(await ui.rollover(pg_vic, "2026")).toBe(0);
    await ui.setToday(pg_vic, "2026-12-22");
    expect(await ui.rolloverUndo(pg_vic)).toBe(false);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-05-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-06-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-07-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-08-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-09-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-10-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-11-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-12-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-01-carried")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-02-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-03-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-04-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-05-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-06-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-07-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-08-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-09-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-10-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-11-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2027-12-carried")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-12").getByTestId("period-locked")).toHaveText("no");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-01 from=2026-01-01 to=2026-01-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-05 from=2026-05-01 to=2026-05-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-06 from=2026-06-01 to=2026-06-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-07 from=2026-07-01 to=2026-07-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-08 from=2026-08-01 to=2026-08-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-09 from=2026-09-01 to=2026-09-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-10 from=2026-10-01 to=2026-10-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-11 from=2026-11-01 to=2026-11-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-12 from=2026-12-01 to=2026-12-31`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-12-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-12-05`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.00 due-total=1.00 overdue-total=0.00`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-01 from=2027-01-01 to=2027-01-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-02 from=2027-02-01 to=2027-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-03 from=2027-03-01 to=2027-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-04 from=2027-04-01 to=2027-04-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-05 from=2027-05-01 to=2027-05-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-06 from=2027-06-01 to=2027-06-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-07 from=2027-07-01 to=2027-07-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-08 from=2027-08-01 to=2027-08-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-09 from=2027-09-01 to=2027-09-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-10 from=2027-10-01 to=2027-10-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-11 from=2027-11-01 to=2027-11-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-12 from=2027-12-01 to=2027-12-31`,
      `OPENING_SET sheet=${sheet} by=vic name=Ada period=2027-01 amount=1.00`,
      `ROLLOVER sheet=${sheet} by=vic fy=FY2026 periods=12`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-01 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-02 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-03 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-04 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-05 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-06 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-07 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-08 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-09 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-10 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-11 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=2026-12 total=1.00`,
      `ROLLOVER_UNDONE sheet=${sheet} by=vic fy=FY2026`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-01 from=2027-01-01 to=2027-01-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-02 from=2027-02-01 to=2027-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-03 from=2027-03-01 to=2027-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-04 from=2027-04-01 to=2027-04-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-05 from=2027-05-01 to=2027-05-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-06 from=2027-06-01 to=2027-06-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-07 from=2027-07-01 to=2027-07-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-08 from=2027-08-01 to=2027-08-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-09 from=2027-09-01 to=2027-09-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-10 from=2027-10-01 to=2027-10-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-11 from=2027-11-01 to=2027-11-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-12 from=2027-12-01 to=2027-12-31`,
      `OPENING_SET sheet=${sheet} by=vic name=Ada period=2027-01 amount=1.00`,
      `ROLLOVER sheet=${sheet} by=vic fy=FY2026 periods=12`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2027-01-05`,
      `CLAIM_VOIDED sheet=${sheet} by=vic person=Ada amount=1.00 date=2027-01-05`,
      `SNAPSHOT sheet=${sheet} by=vic name=Ada due-total=1.00`,
      `ROLLOVER sheet=${sheet} by=vic fy=FY2026 periods=0`,
      `SNAPSHOT sheet=${sheet} by=vic name=Ada due-total=1.00`
    ]);
  });
  test("rollover undo scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "7");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "proof-threshold", "3.00");
    expect(await ui.setRole(pg_uma, "wes", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "pot", "7.77");
    await ui.setSetting(pg_uma, "alert-threshold", "3.00");
    expect(await ui.setSettingDated(pg_uma, "rounding", "half-even", "2026-03-01", "half-even")).toBe(true);
    await ui.setSetting(pg_uma, "max-open", "3");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00", "from": "2026-03-16", "to": "2026-03-12"})).toBe(false);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "terms": "20"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ben", "share": "60.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "40.00", "from": "2026-03-01", "to": "2026-04-30"})).toBe(true);
    expect(await ui.setSettingDated(pg_uma, "floor", "3.00", "2026-03-05", "3.00")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "20.00"})).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.rollover(pg_vic, "2026")).toBe(12);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.setSettingTry(pg_wes, "entry-date", "")).toBe(false);
    expect(await ui.setSettingTry(pg_wes, "policy-date", "2026-03-05")).toBe(false);
    expect(await ui.hold(pg_wes, p_cam, {"from": "2026-02-25", "to": "2026-03-20"})).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    expect(await ui.importRates(pg_wes, "C,10.00\nB,10.00,2026-03-05")).toBeNull();
    expect(await ui.editPerson(pg_wes, p_ben, {"terms": "20"})).toBe(false);
    expect(await ui.pasteClaims(pg_wes, "Ben,10.35,2026-03-15,\nBen,7.77,2026-02-10,a, b\nBen,1.00,,paste")).toBeNull();
    expect(await ui.inlineGrade(pg_wes, p_cam, "A")).toBe(false);
    expect(await ui.statementAsOf(pg_wes, p_ben, "2026-03-15")).toBe(false);
    expect(await ui.inlineGrade(pg_wes, p_cam, "C")).toBe(false);
    expect(await ui.watch(pg_wes, p_cam, true)).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    expect(await ui.generatePeriods(pg_wes, "2026-01-15", "2026-02-20")).toBe(0);
    expect(await ui.addClaim(pg_wes, p_ben, {"amount": "10.35", "note": "n"})).toBeNull();
    expect(await ui.addNote(pg_wes, "")).toBe(false);
    expect(await ui.inlineGrade(pg_wes, p_cam, "C")).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (A)");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("4.66");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-approver")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-score")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-band")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-01-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-02-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-03-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-04-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-05-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-06-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-07-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-08-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-09-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-10-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-11-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-12-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (B)");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("3.11");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-approver")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-score")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-band")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-01-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-02-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-03-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-04-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-05-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-06-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-07-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-08-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-09-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-10-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-11-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-12-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-01").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-02").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-03").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-04").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-05").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-05").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-06").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-06").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-07").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-07").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-08").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-08").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-09").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-09").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-10").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-10").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-11").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-11").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-12").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2027-12").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2027-12").getByTestId("period-fy")).toHaveText("FY2027");
    await expect(pg_wes.getByTestId("period-row-2027-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2027-12").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-01-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-02-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-03-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-04-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-05-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-06-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-07-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-08-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-09-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-10-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-11-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2027-12-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-07-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-08-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-09-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-10-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-11-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2027-12-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-share")).toHaveText("60.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut")).toHaveText("4.66");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut-P1")).toHaveText("4.66");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("40.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("3.11");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut-P1")).toHaveText("3.11");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_wes.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_wes.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_wes.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=3.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=7.77`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-even from=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=max-open value=3`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=60.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=40.00 from=2026-03-01 to=2026-04-30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=3.00 from=2026-03-05`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=20.00`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-01 from=2027-01-01 to=2027-01-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-02 from=2027-02-01 to=2027-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-03 from=2027-03-01 to=2027-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-04 from=2027-04-01 to=2027-04-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-05 from=2027-05-01 to=2027-05-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-06 from=2027-06-01 to=2027-06-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-07 from=2027-07-01 to=2027-07-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-08 from=2027-08-01 to=2027-08-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-09 from=2027-09-01 to=2027-09-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-10 from=2027-10-01 to=2027-10-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-11 from=2027-11-01 to=2027-11-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-12 from=2027-12-01 to=2027-12-31`,
      `ROLLOVER sheet=${sheet} by=vic fy=FY2026 periods=12`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=P1 total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=P2 total=0.00`
    ]);
  });
  test("rollover undo scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "terms", "7");
    await ui.setSetting(pg_uma, "late-pct", "5.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "cap", "5.00");
    expect(await ui.setRole(pg_uma, "vic", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-01");
    await ui.setSetting(pg_uma, "grace-A", "2");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "1.00"}));
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "3.33", "note": ""})).toBe(true);
    await ui.setSetting(pg_uma, "pot", "33.33");
    await ui.setSetting(pg_uma, "alert-threshold", "1.00");
    expect(await ui.setSettingDated(pg_uma, "rounding", "half-even", "2026-03-01", "half-even")).toBe(true);
    await ui.setSetting(pg_uma, "proof-kinds", "receipt");
    await ui.setSetting(pg_uma, "score-mid", "0");
    await ui.setSetting(pg_uma, "score-high", "5");
    await ui.setSetting(pg_uma, "score-log", "on");
    expect(await ui.setRole(pg_uma, "vic", "restricted")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00", "from": "2026-03-10", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A"})).toBeNull();
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A", "terms": "20", "contact": " Ada@x "}));
    expect(await ui.editPerson(pg_uma, p_ada, {"terms": "3", "termsFrom": "2026-03-12"})).toBe(true);
    expect(await ui.setApprover(pg_uma, p_ada, "uma")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00"})).toBe(true);
    expect(await ui.hold(pg_uma, p_ada, {"from": "2026-03-15", "to": "2026-04-02"})).toBe(true);
    expect(await ui.compareSheet(pg_uma, `${sheet}-p`)).toEqual(["A 0.00 1.00", "B 0.00 0.00", "C 0.00 0.00"]);
    expect(await ui.addNote(pg_uma, "")).toBe(false);
    expect(await ui.importOpenings(pg_uma, "Ada,P1,1.00")).toBe(1);
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "C", "gradeFrom": "2026-03-20"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    const c_ada_0 = ui.must(await ui.quickAdd(pg_uma, {"name": "Ada", "amount": "99.95"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "7.77", "date": "2026-03-15", "tags": "b,a,a"}));
    const c_ada_2 = ui.must(await ui.addClaimTwice(pg_uma, p_ada, {"amount": "4.00", "date": "2026-02-10"}));
    expect(await ui.claimCount(pg_uma, p_ada)).toBe(3);
    expect(await ui.watch(pg_uma, p_ada, true)).toBe(true);
    expect(await ui.editInline(pg_uma, c_ada_2, "7.77")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.flag(pg_wes, p_ada, "late", "2026-03-12")).toBe(true);
    expect(await ui.statement(pg_wes, p_ada)).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    const c_ada_3 = ui.must(await ui.claimFromTemplate(pg_wes, p_ada, "T1"));
    await ui.refresh(pg_wes);
    expect(await ui.transfer(pg_wes, p_ada, `${sheet}-t`)).toBe(true);
    const p_dot = ui.must(await ui.addPerson(pg_wes, {"name": "Dot", "grade": "B"}));
    expect(await ui.search(pg_wes, "e")).toEqual([`${sheet}-p Ben (A) 1.00`]);
    expect(await ui.inlineGrade(pg_wes, p_dot, "B")).toBe(true);
    const c_dot_0 = ui.must(await ui.quickAdd(pg_wes, {"name": "Dot", "amount": "7.77"}));
    expect(await ui.periodAction(pg_wes, "P1", "close")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("2.59");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-status-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-name")).toHaveText("Dot (B)");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-terms")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-approver")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-score")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-band")).toHaveText("MID");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("2.59");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-20 due=2.59"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=5.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=2`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=3.33 note=`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-even from=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-kinds value=receipt`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-mid value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-high value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-log value=on`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=restricted`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00 from=2026-03-10 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A terms=20 contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=A terms=3`,
      `APPROVER_SET sheet=${sheet} by=uma name=Ada user=uma`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ada from=2026-03-15`,
      `OPENING_SET sheet=${sheet} by=uma name=Ada period=P1 amount=1.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-15 tags=a,b`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-02-10`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Ada`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-02-10`,
      `PERSON_FLAGGED sheet=${sheet} by=wes name=Ada reason=late until=2026-03-12`,
      `STATEMENT sheet=${sheet} by=wes name=Ada due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=3.33 date=2026-03-01`,
      `PERSON_TRANSFERRED sheet=${sheet} by=wes name=Ada to=${sheet}-t`,
      `PERSON_ADDED sheet=${sheet} by=wes name=Dot grade=B`,
      `ROLLUP sheet=${sheet} by=wes person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Dot grade=B`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Dot amount=7.77 date=2026-03-01`,
      `PERIOD_CLOSED sheet=${sheet} by=wes period=P1 total=0.00`
    ]);
  });
  test("rollover undo scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "terms-C", "20");
    await ui.setSetting(pg_uma, "perm-open", "clerk");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-03-24")).toBe(true);
    await ui.setSetting(pg_uma, "grace-C", "2");
    await ui.setSetting(pg_uma, "proof-threshold-B", "4.00");
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "pot", "100.00");
    await ui.setSetting(pg_uma, "fiscal-start-month", "7");
    expect(await ui.setSettingDated(pg_uma, "rounding", "half-even", "2026-03-01", "half-even")).toBe(true);
    await ui.setSetting(pg_uma, "escalate-after", "7");
    await ui.setSetting(pg_uma, "score-mid", "0");
    await ui.setSetting(pg_uma, "score-high", "1");
    expect(await ui.setRole(pg_uma, "wes", "restricted")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "contact": "ADA@X"}));
    expect(await ui.addCrew(pg_uma, "C1", "Cam")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "C1", "Ben")).toBe(true);
    expect(await ui.editPerson(pg_uma, p_cam, {"terms": "3", "termsFrom": "2026-03-12"})).toBe(true);
    const pl_cam_1 = ui.must(await ui.addPlan(pg_uma, p_cam, {"amount": "1.00", "start": "2026-03-01", "end": "2026-04-30", "every": "7"}));
    expect(await ui.snapshotCompare(pg_uma, "2026-03-10", "2026-03-10")).toEqual(["Cam  ", "Ben  "]);
    expect(await ui.pasteClaims(pg_uma, "Ben,10.35,2026-03-01,\nBen,4.00,,paste\nBen,25.00,,")).toBeNull();
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.rollover(pg_vic, "2026")).toBeNull();
    expect(await ui.addPatron(pg_vic, p_cam, "Ben")).toBe(true);
    await ui.sortBy(pg_vic, "due-total");
    expect(await ui.statement(pg_vic, p_cam)).toBe(true);
    expect(await ui.activity(pg_vic)).toEqual(["uma CREW_ADDED 1", "uma CREW_MEMBER_ADDED 1", "uma HOLIDAY_ADDED 2", "uma PERIOD_ADDED 2", "uma PERSON_ADDED 2", "uma PERSON_EDITED 1", "uma PLAN_ADDED 1", "uma RATE_SET 2", "uma ROLE_SET 2", "uma ROLLUP 2", "uma SETTING_CHANGED 14", "vic PATRON_ADDED 1", "vic STATEMENT 1"]);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-reviews-count")).toHaveText("0");
    expect(await ui.periodAction(pg_vic, "P2", "soft-close")).toBe(true);
    const c_cam_0 = ui.must(await ui.addClaim(pg_vic, p_cam, {"amount": "7.77", "note": "n", "ref": "inv 7"}));
    expect(await ui.importPeople(pg_vic, "Eve,C")).toMatchObject({"added": 1, "updated": 0});
    const p_eve = await ui.personId(pg_vic, "Eve");
    await ui.refresh(pg_vic);
    expect(await ui.transfer(pg_vic, p_eve, `${sheet}-t`)).toBe(true);
    expect(await ui.planAmount(pg_vic, pl_cam_1, "0.04")).toBe(true);
    expect(await ui.hold(pg_vic, p_ben, {"from": "2026-03-20"})).toBe(true);
    expect(await ui.ratePreview(pg_vic, "A", "20.00")).toEqual({ count: 0, diff: "0.00" });
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("0.58");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-reviews-count")).toHaveText("0");
    await ui.setSetting(pg_vic, "cap", "");
    expect(await ui.importOpenings(pg_vic, "Ben,P2,5.50")).toBe(1);
    expect(await ui.addComment(pg_vic, c_cam_0, "ok")).toBe(true);
    const c_ben_0 = ui.must(await ui.addClaim(pg_vic, p_ben, {"amount": "3.33", "date": "2026-03-15", "note": "n"}));
    expect(await ui.generateFy(pg_vic, "2026")).toBe(12);
    await ui.refresh(pg_vic);
    expect(await ui.archive(pg_vic)).toBe(true);
    expect(await ui.addClaim(pg_vic, p_ben, {"amount": "20.00"})).toBeNull();
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-status-DRAFT-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("2026-03-10");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("Ben (C) 100.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-band")).toHaveText("MID");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-07-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-08-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-09-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-10-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-11-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-12-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-01-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-05-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2027-06-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("0.58");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-03-31");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-03-10 due=0.58"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("inv 7");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText(["vic on 2026-03-10: ok"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (C)");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-band")).toHaveText("MID");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-07-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-08-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-09-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-10-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-11-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2026-12-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-01-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-05-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-2027-06-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-15");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due-by")).toHaveText("2026-04-14");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-03-10 due=0.50"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-07").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-08").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-09").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-10").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-11").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-12").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-01").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-05").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2027-06").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-07-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-08-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-09-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-10-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-11-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-12-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-01-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-02-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-03-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-04-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-05-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2027-06-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-12-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2027-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2027-05-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2027-06-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ben).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ben).getByTestId("pool-cut")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Cam (A)");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-01")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-02")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-03")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-04")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-05")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-06")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-07")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-08")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-09")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-10")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-11")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-12")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-next-dates")).toHaveText("2026-03-15, 2026-03-22, 2026-03-29, 2026-04-05, 2026-04-12");
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-paused")).toHaveText("no");
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-change-line")).toHaveText(["2026-03-10 amount=0.04"]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-open value=clerk`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-C value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-B value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-even from=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-mid value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-high value=1`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=restricted`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Cam`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ben`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A terms=`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Cam amount=1.00 start=2026-03-01 every=7 end=2026-04-30`,
      `PATRON_ADDED sheet=${sheet} by=vic name=Cam patron=Ben`,
      `STATEMENT sheet=${sheet} by=vic name=Cam due-total=0.00 claims=0`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=vic period=P2 total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=7.77 date=2026-03-10 ref=inv 7`,
      `LATE_ENTRY sheet=${sheet} by=vic person=Cam amount=7.77 date=2026-03-10`,
      `PERSON_ADDED sheet=${sheet} by=vic name=Eve grade=C`,
      `ROLLUP sheet=${sheet} by=vic person=Eve claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_TRANSFERRED sheet=${sheet} by=vic name=Eve to=${sheet}-t`,
      `PLAN_CHANGED sheet=${sheet} by=vic name=Cam start=2026-03-01 amount=0.04`,
      `PERSON_HELD sheet=${sheet} by=vic name=Ben from=2026-03-20`,
      `SETTING_CHANGED sheet=${sheet} by=vic key=cap value=`,
      `OPENING_SET sheet=${sheet} by=vic name=Ben period=P2 amount=5.50`,
      `COMMENT_ADDED sheet=${sheet} by=vic person=Cam amount=7.77 date=2026-03-10 text=ok`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ben amount=3.33 date=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2026-07 from=2026-07-01 to=2026-07-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2026-08 from=2026-08-01 to=2026-08-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2026-09 from=2026-09-01 to=2026-09-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2026-10 from=2026-10-01 to=2026-10-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2026-11 from=2026-11-01 to=2026-11-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2026-12 from=2026-12-01 to=2026-12-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-01 from=2027-01-01 to=2027-01-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-02 from=2027-02-01 to=2027-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-03 from=2027-03-01 to=2027-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-04 from=2027-04-01 to=2027-04-30`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-05 from=2027-05-01 to=2027-05-31`,
      `PERIOD_ADDED sheet=${sheet} by=vic period=2027-06 from=2027-06-01 to=2027-06-30`,
      `SHEET_ARCHIVED sheet=${sheet} by=vic`
    ]);
  });
});
