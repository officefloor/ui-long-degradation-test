"""The story scripts of the stream, one per checkpoint, as functions of the checkpoint k they
are rendered at (a ripple copy re-renders a prior's script at the mutative's k, so a script may
branch on k where a later rule changes what the test must do to arrange its data).

A script is a list of steps (see harness.stream_build.render for the vocabulary). Every value a
step asserts is computed by the reference model (harness/oracle/hell.py); the script says only
what the test does and which figures it reads. A checkpoint's spec also carries the scenarios
harness.oracle.hell_gen generates for it; these stories state the feature, the generated ones
cross it with everything already in force.
"""
from __future__ import annotations

T = "2026-03-10"          # the sheet's today in most scripts


RATES = (("A", "10.00"), ("B", "12.50"))


def _base(k: int, today: str = T, people=(("Ada", "A"), ("Ben", "B")), rates=RATES) -> list:
    s = [("as", "uma")]
    if k >= 2:
        s.append(("today", today))
    if k >= 7:
        for g, r in rates:
            s.append(("rate", g, r))
    for n, g in people:
        s.append(("person", n, g))
    return s


def _open(k: int, *refs) -> list:
    return [("open", n, i) for n, i in refs] if k >= 8 else []


FIG = {"people": ["claimed", "due-total"], "claims": ["due", "status"], "rollups": True}


def cp01(k):
    return [("as", "uma"), ("check", {"header": True}), ("as", "vic"), ("check", {"header": True})]


def cp02(k):
    return [("as", "uma"), ("today", "2026-03-10"), ("check", {"header": True, "today": True}),
            ("today", "2024-02-29"), ("check", {"header": True, "today": True})]


def cp03(k):
    return _base(k, people=(), rates=()) + [
        ("person", "Ada", "A"), ("person", "Ben", "B"), ("person", "", "A"), ("person", "Cam", "C"),
        ("person", " ada ", "B"),
        ("edit", "Ben", {"grade": "C"}),
        ("check", {"people": ["name", "grade"], "audit": True})]


def cp04(k):
    return _base(k, people=(), rates=()) + [
        ("person", "Ada", "A"), ("person", "ADA", "B"), ("person", " Ada ", "C"),
        ("person", "Ben", "B"), ("edit", "Ben", {"name": "ada"}),
        ("edit", "Ben", {"name": " Cam "}),
        ("person", "cam", "A"),
        ("check", {"people": ["name", "grade"], "audit": True})]


def cp05(k):
    return _base(k, rates=()) + [
        ("claim", "Ada", "10.00", "2026-03-01", "first"), ("claim", "Ada", "2.50"),
        ("claim", "Ben", "0.00", None, "zero"), ("claim", "Ben", "-1.00"), ("claim", "Ada", "1.234"),
        ("claim_edit", "Ada", 0, {"amount": "11.00"}),
        *_open(k, ("Ada", 0), ("Ben", 0)),
        ("check", {"claims": ["amount", "date", "note"], "people": ["claimed"], "rollups": True,
                   "audit": True})]


def cp06(k):
    return _base(k, people=(("Ada", "A"),), rates=()) + [
        ("edit", "Ada", {"grade": "B"}),
        ("claim", "Ada", "5.00", "2026-03-02", "n"), ("claim", "Ada", "1.005"),
        ("claim_edit", "Ada", 0, {"amount": "6.00", "note": "m"}),
        ("person", "Ada", "C"),
        ("check", {"people": ["name", "grade"], "claims": ["amount", "note"], "audit": True})]


def cp07(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C"))) + [
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "10.25", "2026-03-02"),
        ("claim", "Ben", "4.00"), ("claim", "Cam", "4.00"),
        *_open(k, ("Ada", 0), ("Ada", 1), ("Cam", 0)),
        ("check", {"claims": ["due"], "people": ["due-total"], "rollups": True, "rates": True}),
        ("edit", "Ada", {"grade": "B"}),
        ("check", {"claims": ["due"], "people": ["grade", "due-total"], "rollups": True,
                   "audit": True})]


def cp08(k):
    return _base(k, people=(("Ada", "A"),)) + [
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("claim_edit", "Ada", 0, {"amount": "15.00"}),
        ("as", "vic"), ("settle", "Ada", 1),
        ("void", "Ada", 2), ("void", "Ada", 1), ("settle", "Ada", 2), ("open", "Ada", 0),
        ("check", {"claims": ["amount", "status", "due"], "people": ["claimed", "due-total"],
                   "rollups": True, "audit": True})]


def cp09(k):
    return _base(k) + [
        ("claim", "Ada", "1.00"), ("claim", "Ada", "2.00"), ("claim", "Ben", "3.00"),
        ("claim", "Ben", "4.00"),
        ("open", "Ada", 0), ("void", "Ada", 0), ("open", "Ben", 0),
        ("open_both", ("Ada", 1, "uma"), ("Ben", 1, "vic")),
        ("check", {"claims": ["number", "status"]})]


def cp10(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "20.00"), ("claim", "Ada", "3.00"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("as", "vic"), ("settle", "Ada", 0),
        ("rate", "A", "20.00"),
        ("check", {"claims": ["due", "status"], "people": ["due-total"], "rollups": True,
                   "audit": True})]


def cp11(k):
    return _base(k, people=(), rates=()) + [
        ("rate", "A", "10.00"), ("rate", "A", "20.00", "2026-03-05"), ("rate", "B", "5.00", "2026-03-01"),
        ("person", "Ada", "A"), ("person", "Ben", "B"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-05"),
        ("claim", "Ada", "10.00"), ("claim", "Ben", "10.00", "2026-02-20"),
        ("claim", "Ben", "10.00", "2026-03-02"),
        ("rate", "A", "30.00", "2026-03-05"),
        *_open(k, ("Ada", 0), ("Ada", 1), ("Ada", 2), ("Ben", 0), ("Ben", 1)),
        ("check", {"claims": ["due"], "people": ["due-total"], "rollups": True, "rates": True,
                   "audit": True})]


def cp12(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "10.35"), ("claim", "Ada", "10.45"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"claims": ["due"], "people": ["due-total"], "rollups": True})]


def cp13(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"),
        ("open", "Ada", 0), ("settle", "Ada", 0),
        ("as", "vic"), ("open", "Ada", 1), ("settle", "Ada", 1), ("settle", "Ada", 0),
        ("as", "uma"), ("settle", "Ada", 1),
        ("check", {"claims": ["status", "opened-by"], "audit": True})]


def cp14(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("edit_open", "Ada"), ("as", "vic"), ("edit_open", "Ada"), ("edit_save", {"grade": "B"}),
        ("as", "uma"), ("edit_save", {"grade": "C"}),
        ("edit", "Ada", {"grade": "C"}),
        ("claim2", "Ada", "5.00", "2026-03-01", "once"),
        ("check", {"people": ["grade"], "claims": ["amount", "note"], "audit": True})]


def cp15(k):
    return _base(k) + [
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ben", "4.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("statement", "Ada"),
        ("rate", "A", "20.00"),
        ("claim", "Ada", "30.00"), ("open", "Ada", 2),
        ("check", {"claims": ["due", "stated"], "people": ["due-total", "statement-count", "stated-total",
                                                            "statement-date"], "rollups": True}),
        ("today", "2026-03-11"), ("statement", "Ada"), ("void", "Ada", 0), ("statement", "Ben"),
        ("rate", "B", "20.00"),
        ("check", {"claims": ["due", "stated", "status"], "people": ["due-total", "statement-count",
                   "stated-total", "statement-date"], "rollups": True, "audit": True})]


def cp16(k):
    return _base(k) + [
        ("claim", "Ada", "10.00"), ("claim", "Ben", "20.00"),
        ("open", "Ada", 0), ("open", "Ben", 0),
        ("rate", "A", "20.00"), ("rate", "B", "12.50"),
        ("edit", "Ben", {"grade": "A"}),
        ("today", "2026-03-11"),
        ("statement", "Ada"), ("rate", "A", "30.00"),
        ("as", "vic"), ("settle", "Ben", 0), ("void", "Ada", 0),
        ("statement", "Ada"), ("person", "Cam", "C"),
        ("check", {"claims": ["due", "status", "stated"], "people": ["claimed", "due-total"],
                   "rollups": True, "audit": True})]


def cp17(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("period", "P3", "2026-03-05", "2026-03-15"), ("period", "P4", "2026-03-25", "2026-03-21"),
        ("period", "P1", "2026-04-01", "2026-04-02"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-15"),
        ("claim", "Ada", "30.00", "2026-03-25"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("check", {"claims": ["period", "due"], "periods": True, "audit": True})]


def cp18(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ada", "20.00", "2026-03-15"),
        ("claim", "Ada", "5.00", "2026-03-06"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("close", "P1"),
        ("claim", "Ada", "7.00", "2026-03-07"), ("open", "Ada", 2), ("void", "Ada", 0),
        ("claim_edit", "Ada", 2, {"amount": "6.00"}),
        ("as", "vic"), ("settle", "Ada", 0),
        ("rate", "A", "20.00"),
        ("check", {"claims": ["due", "status"], "periods": True, "rollups": True, "audit": True})]


def cp19(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("quick", "Ada", "5.00"), ("quick", "Dot", "7.00"), ("quick", "", "1.00"),
        ("quick", "Ada", "-1.00"), ("quick", " dot ", "2.00"),
        ("check", {"people": ["name", "grade", "claimed"], "claims": ["amount", "date", "note", "status"],
                   "audit": True})]


def cp20(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"),
        ("open", "Ada", 0),
        ("claim_edit", "Ada", 0, {"amount": "15.00"}), ("claim_edit", "Ada", 1, {"amount": "25.00"}),
        ("void", "Ada", 0), ("open", "Ada", 1),
        ("check", {"claims": ["amount", "number", "status"], "people": ["due-total"], "audit": True})]


def cp21(k):
    return _base(k) + [
        ("claim", "Ada", "10.00", "2026-03-05"),
        ("retire", "Ada", "2026-03-08"),
        ("claim", "Ada", "20.00", "2026-03-09"), ("claim", "Ada", "30.00", "2026-03-08"),
        ("open", "Ada", 0), ("open", "Ada", 1),
        ("hidden", "Ada"),
        ("check", {"people": ["retired", "retired-from", "due-total"], "rollups": True}),
        ("show_retired", True),
        ("check", {"people": ["retired", "retired-from", "due-total"], "claims": ["status", "due"],
                   "audit": True})]


def cp22(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ada", "40.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("as", "vic"), ("settle", "Ada", 2),
        ("hold", "Ada"),
        ("check", {"people": ["hold", "claimed", "due-total"], "claims": ["due", "status"],
                   "rollups": True}),
        ("hold", "Ada"),
        ("check", {"people": ["hold", "claimed", "due-total"], "rollups": True, "audit": True})]


def cp23(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("rate", "A", "20.00", "2026-03-05"),
        ("role", "vic", "steward"), ("role", "wes", "boss"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "10.25", "2026-03-06"),
        ("claim", "Ada", "15.05", "2026-03-01"), ("claim", "Ada", "30.00"),
        ("as", "vic"), ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("as", "uma"), ("settle", "Ada", 0), ("settle", "Ada", 1), ("settle", "Ada", 2),
        ("as", "vic"), ("settle", "Ada", 1),
        ("as", "wes"), ("settle", "Ada", 3),
        ("check", {"claims": ["status", "due"], "people": ["due-total"], "audit": True})]


def cp24(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-31"),
        ("claim", "Ada", "5.00"), ("claim", "Ada", "20.00"), ("claim", "Ada", "12.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("as", "vic"), ("settle", "Ada", 0),
        ("check", {"claims": ["due"], "people": ["due-total"], "periods": True, "rollups": True}),
        ("statement", "Ada"), ("claim", "Ada", "4.00"), ("open", "Ada", 3),
        ("setting", "floor", "3.00"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"], "periods": True, "rollups": True}),
        ("close", "P1"), ("setting", "floor", "5.00"), ("statement", "Ada"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"], "periods": True, "rollups": True,
                   "audit": True})]


def cp25(k):
    return _base(k, today="2026-03-30", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("setting", "terms", "10"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00", "2026-03-25"),
        ("claim", "Ben", "30.00", "2026-03-19"), ("claim", "Ben", "40.00", "2026-03-20"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ben", 0),
        ("check", {"claims": ["due-by", "overdue", "due"], "people": ["overdue-count", "overdue-total"],
                   "rollups": True}),
        ("today", "2026-03-31"),
        ("check", {"claims": ["due-by", "overdue"], "people": ["overdue-count", "overdue-total"],
                   "rollups": True, "audit": True})]


def cp26(k):
    return _base(k, today="2026-05-01", people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("setting", "terms", "10"),
        ("claim", "Ada", "20.00", "2026-03-01"), ("claim", "Ada", "20.00", "2026-02-01"),
        ("claim", "Ada", "10.25", "2026-04-25"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("statement", "Ada"), ("setting", "late-pct", "10.00"),
        ("check", {"claims": ["due", "overdue", "stated"], "people": ["due-total", "overdue-total"],
                   "rollups": True}),
        ("rate", "A", "20.00"),
        ("as", "vic"), ("settle", "Ada", 1),
        ("setting", "late-pct", "20.00"), ("today", "2026-06-01"),
        ("check", {"claims": ["due", "status", "stated"], "people": ["due-total", "overdue-total"],
                   "rollups": True, "audit": True})]


def cp27(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "C")),
                 rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "10.00", "2026-03-01"),
        ("claim", "Cam", "10.00"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0),
        ("patron", "Ada", "Ben"), ("patron", "Ada", "Cam"), ("patron", "Ben", "Ada"),
        ("patron", "Ada", "Ada"), ("patron", "Ada", "Ben"),
        ("check", {"people": ["patrons", "backing", "due-total"]}),
        ("hold", "Ben"),
        ("check", {"people": ["patrons", "backing", "due-total"], "audit": True})]


def cp28(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "10.00", "2026-03-06"),
        ("claim", "Ada", "10.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("edit", "Ada", {"grade": "B", "grade_from": "2026-03-05"}),
        ("check", {"claims": ["due"], "people": ["grade", "due-total"], "rollups": True}),
        ("edit", "Ada", {"grade": "C"}),
        ("check", {"claims": ["due"], "people": ["grade", "due-total"], "rollups": True, "audit": True})]


def cp29(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-31"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "30.00"), ("open", "Ada", 0), ("open", "Ada", 1),
        ("statement", "Ada"), ("void", "Ada", 1), ("claim", "Ada", "50.00"), ("open", "Ada", 2),
        ("close", "P1"), ("rate", "A", "20.00"),
        ("reopen", "P1"),
        ("check", {"periods": True, "claims": ["due", "stated"]}),
        ("role", "vic", "steward"), ("as", "vic"), ("reopen", "P1"), ("reopen", "P1"),
        ("check", {"periods": True, "claims": ["due", "stated"], "people": ["due-total"], "audit": True})]


def cp30(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "50.00"), ("open", "Ada", 0), ("as", "vic"), ("settle", "Ada", 0),
        ("as", "uma"),
        ("claim", "Ada", "-20.00", None, "fix", "1"), ("open", "Ada", 1), ("as", "vic"), ("settle", "Ada", 1),
        ("as", "uma"),
        ("claim", "Ada", "-5.00", None, "", "9"), ("claim", "Ada", "-5.00"),
        ("claim", "Ada", "-5.00", None, "", "2"),
        ("claim", "Ada", "-3.00", "2026-03-01", "", "1"), ("open", "Ada", 2),
        ("check", {"claims": ["due", "corrects", "number", "status"], "people": ["due-total"],
                   "rollups": True, "audit": True})]


def cp31(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"), ("Cam", "A"))) + [
        ("period", "P1", "2026-03-01", "2026-03-10"),
        ("claim", "Ada", "10.00", "2026-03-05"), ("claim", "Ben", "20.00", "2026-03-15"),
        ("claim", "Cam", "30.00", "2026-03-05"), ("claim", "Cam", "40.00"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Cam", 0),
        ("as", "vic"), ("settle", "Cam", 0), ("void", "Cam", 1),
        ("retire", "Cam", "2026-03-10"), ("hold", "Ben"),
        ("check", {"summary": True, "people": ["due-total"], "periods": True, "rollups": True})]


def cp32(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.25", "2026-03-01"), ("claim", "Ada", "10.25"),
        ("claim", "Ada", "10.35", "2026-03-09"), ("claim", "Ada", "10.45", "2026-03-02"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("as", "vic"), ("settle", "Ada", 0), ("as", "uma"), ("statement", "Ada"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"]}),
        ("setting", "policy-date", "2026-03-05"),
        ("claim", "Ada", "-10.25", None, "fix", "1"), ("open", "Ada", 4),
        ("check", {"claims": ["due", "stated", "corrects"], "people": ["due-total"]}),
        ("setting", "policy-date", "2026-03-15"), ("statement", "Ada"),
        ("check", {"claims": ["due", "stated"], "people": ["due-total"]}),
        ("as", "vic"), ("settle", "Ada", 2), ("setting", "policy-date", ""),
        ("check", {"claims": ["due", "status", "stated"], "people": ["due-total"], "audit": True})]


def cp33(k):
    return _base(k, people=(("Ada", "A"), ("Lee, Jo", "B"), ('Ann "Q"', "C"))) + [
        ("claim", "Ada", "10.00"), ("claim", "Lee, Jo", "10.00"),
        ("open", "Ada", 0), ("open", "Lee, Jo", 0),
        ("retire", 'Ann "Q"', "2026-03-01"),
        ("export",)]


def cp34(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B"))) + [
        ("period", "P1", "2026-03-01", "2026-03-05"),
        ("claim", "Ada", "10.00"), ("claim", "Ada", "20.00"), ("claim", "Ben", "30.00", "2026-03-03"),
        ("claim", "Ben", "40.00"), ("open", "Ben", 1),
        ("close", "P1"),
        ("bulk_open", [("Ada", 0), ("Ada", 1), ("Ben", 0), ("Ben", 1)]),
        ("check", {"claims": ["number", "status"], "audit": True})]


def cp35(k):
    return _base(k, today="2026-03-15", people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("period", "P1", "2026-03-01", "2026-03-10"), ("period", "P2", "2026-03-11", "2026-03-20"),
        ("claim", "Ada", "1.00", "2026-03-05"), ("claim", "Ada", "2.00"), ("claim", "Ada", "3.00", "2026-03-25"),
        ("claim", "Ada", "4.00", "2026-03-06"), ("claim", "Ada", "5.00", "2026-03-12"), ("claim", "Ada", "6.00"),
        ("open", "Ada", 0),
        ("setting", "period-numbering-from", "2026-03-16"), ("open", "Ada", 1),
        ("setting", "period-numbering-from", "2026-03-15"),
        ("open", "Ada", 2), ("open", "Ada", 3), ("open", "Ada", 4),
        ("setting", "period-numbering-from", ""), ("open", "Ada", 5),
        ("check", {"claims": ["number", "period"], "audit": True})]


def cp36(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("role", "vic", "steward"), ("role", "wes", "steward"), ("setting", "clerk-limit", "1.50"),
        ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"), ("claim", "Ada", "10.00"),
        ("as", "vic"), ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2),
        ("as", "uma"), ("statement", "Ada"), ("rate", "A", "20.00"),
        ("settle", "Ada", 0), ("settle", "Ada", 1), ("settle", "Ada", 2),
        ("check", {"claims": ["status", "due", "stated"], "people": ["due-total"], "rollups": True}),
        ("as", "vic"), ("approve", "Ada", 0),
        ("as", "wes"), ("approve", "Ada", 0), ("reject", "Ada", 1, "no"),
        ("as", "uma"), ("approve", "Ada", 1),
        ("check", {"claims": ["status", "due", "stated"], "people": ["due-total"], "rollups": True,
                   "audit": True})]


def cp37(k):
    return _base(k, people=(("Ada", "A"), ("Ben", "B")), rates=(("A", "10.00"), ("B", "20.00"))) + [
        ("role", "vic", "steward"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00"), ("claim", "Ada", "30.00"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("statement", "Ada"),
        ("as", "vic"), ("settle", "Ada", 1),
        ("as", "uma"), ("reassign", "Ada", 0, "Ben"),
        ("as", "vic"), ("reassign", "Ada", 0, "Ben"), ("reassign", "Ada", 1, "Ben"),
        ("reassign", "Ada", 2, "Ben"),
        ("check", {"claims": ["number", "due", "status", "stated"], "people": ["claimed", "due-total"],
                   "rollups": True, "audit": True})]


def cp38(k):
    return _base(k, today="2026-03-20", people=(("Ada", "A"), ("Ben", "B"))) + [
        ("setting", "terms", "10"), ("setting", "terms-B", "20"),
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ben", "10.00", "2026-03-01"),
        ("setting", "terms", "5"), ("claim_edit", "Ada", 0, {"date": "2026-03-03"}),
        ("claim", "Ada", "10.00", "2026-03-02"),
        ("open", "Ada", 0), ("open", "Ben", 0), ("open", "Ada", 1),
        ("check", {"claims": ["date", "due-by", "overdue"], "people": ["overdue-count"], "audit": True})]


def cp39(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "20.00"), ("open", "Ada", 0),
        ("today", "2026-03-11"), ("rate", "A", "20.00"),
        ("as", "vic"), ("settle", "Ada", 0),
        ("today", "2026-03-12"), ("rate", "A", "30.00"),
        ("claim", "Ada", "10.00"), ("open", "Ada", 1), ("void", "Ada", 1),
        ("check", {"claims": ["due", "status", "log"]})]


def cp40(k):
    return _base(k, people=(("Ada", "A"),), rates=(("A", "10.00"),)) + [
        ("claim", "Ada", "10.00", "2026-03-01"), ("claim", "Ada", "20.00", "2026-03-06"),
        ("claim", "Ada", "40.00"), ("claim", "Ada", "80.00", "2026-03-08"),
        ("open", "Ada", 0), ("open", "Ada", 1), ("open", "Ada", 2), ("open", "Ada", 3),
        ("as", "vic"), ("settle", "Ada", 3), ("statement", "Ada"),
        ("claim", "Ada", "16.00", "2026-03-07"), ("open", "Ada", 4),
        ("hold", "Ada", "2026-03-05", "2026-03-08"),
        ("check", {"people": ["hold", "claimed", "due-total"], "claims": ["due", "status", "stated"],
                   "rollups": True}),
        ("hold", "Ada", "2026-03-10", None),
        ("check", {"people": ["hold", "claimed", "due-total"], "rollups": True, "audit": True})]


SCRIPTS = {n: globals()[f"cp{n:02d}"] for n in range(1, 41)}
