"""A model of one browser session on the worksheet: the stored world plus the screen's UI state.

`harness.spec_check` replays a test's recorded steps through a Session: `seed`, `goto`, `reload`,
`fill`, `select`, `click`, then reads the screen through `view()`. What a click DOES is a definition
like any concept, so it is registered by the act that introduces the control (`@control(...)` in
act1.py, act2.py, ...) and versioned by checkpoint. A click on a control nobody registered raises
Unmodelled, and the checker reports the rest of that test as unverified.
"""
from __future__ import annotations

from .core import DEFAULT_SHEET, REGISTRY, Ctx, Registry, Unmodelled, View, World, _load_acts


def parse_input(text: str):
    """A typed form value: a whole number when it reads as one, None when blank, else the text."""
    t = (text or "").strip()
    if t == "":
        return None
    try:
        return int(t)
    except ValueError:
        return t


class Session:
    """The stored world and the screen state of one test at checkpoint k."""

    def __init__(self, k: int, registry: Registry = REGISTRY):
        _load_acts()
        self.k, self.registry = k, registry
        self.world = World({})
        self.audit: list[str] = []
        self.version = 0                  # bumped on every change, so views can be cached
        self._reset_screen()

    def _reset_screen(self) -> None:
        self.sheet = DEFAULT_SHEET
        self.as_of = None
        self.as_of_by_sheet: dict = {}    # each sheet's own as-of date while another is open (cp244)
        self.form: dict = {}
        self.editing = None
        self.flags: dict = {}
        self.version += 1

    # -- steps
    def seed(self, fixture: dict) -> None:
        self.world = World(fixture)
        self.audit = []
        self._reset_screen()

    def goto(self, url: str = "/") -> None:
        if url != "/":
            raise Unmodelled("navigation", f"goto {url}")
        self._reset_screen()

    def reload(self) -> None:
        """A refresh keeps the stored data and loses the screen state (open sheet, as-of, forms)."""
        self._reset_screen()

    def fill(self, tid: str, value: str) -> None:
        self.form[tid] = value
        self.version += 1

    def select(self, tid: str, option: dict) -> None:
        self.form[tid] = option
        self.version += 1

    def click(self, tid: str) -> None:
        hit = self.registry.control_at(tid, self.k)
        if hit is None:
            raise Unmodelled(f"control {tid}", f"no click handler at cp{self.k:02d}")
        fn, suffix = hit
        self.flags.pop("person-state-error", None)
        fn(self, suffix)
        self.version += 1

    # -- reading
    def ctx(self, as_of: str | None = ...) -> Ctx:
        return Ctx(self.world, self.k, self.sheet, self.as_of if as_of is ... else as_of,
                   self.registry, dict(self.flags, form=self.form, editing=self.editing))

    def view(self) -> View:
        return View(self.ctx())

    # -- helpers for control handlers
    def row_id(self, suffix: str):
        """The row id on the open sheet that a control suffix names."""
        sh = self.world.sheet(self.sheet)
        for pid in (sh.rows if sh else {}):
            if str(pid) == suffix:
                return pid
        raise Unmodelled("row", f"no row {suffix!r} on sheet {self.sheet!r}")

    def take_form(self, prefix: str) -> dict:
        """The filled form fields under `prefix`, keyed by the rest of the id, and clear them."""
        out = {t[len(prefix):]: v for t, v in self.form.items() if t.startswith(prefix)}
        for t in [t for t in self.form if t.startswith(prefix)]:
            del self.form[t]
        return out
