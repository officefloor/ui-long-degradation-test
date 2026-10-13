"""Panel waits: after a test clicks an invoice row while the panel may already show another invoice,
wait for the panel to show the clicked one before acting on it; and after a test sends an invoice,
wait for the send to finish before going on.

Without the wait, an app that loads the panel asynchronously can apply the next send, approve or
payment to the invoice that was open before, failing a correct implementation at random. The wait
compares the panel's number with the clicked row's own number, so it holds under every numbering
rule the stream introduces (Luhn, mod-11, credit and adjustment notes). Invoice numbers first show
at cp07, so a spec that runs before cp07 cannot use it: `main` reports any such site instead.

A send needs its own wait because what a test checks after sending is often already true of the
draft (its tax, its total): the test then goes on while the send is still in flight. Its late
response can put the sent invoice back in the panel over the row the test has since clicked, and a
send still running when a test ends can change the next test's freshly seeded data. So a send with
no check after it that only its answer can satisfy (a status other than Draft, or the send error)
gets one: the panel status leaving Draft. A send the test expects refused checks the send error or
the Draft status and gets none. check_actions confirms the model lets every waited-for send go.

Run over acceptance/specs after any spec is (re)written; idempotent. Every act's build.py calls it
last, and it covers the hand-written Act I specs too:

    .venv/bin/python acceptance/reference/panel_waits.py
"""
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPECS = os.path.join(REPO, 'acceptance', 'specs')
NUMBERS_FROM = 7     # cp07 shows the invoice number in the list and on the panel

ROW_CLICK = re.compile(r"^(\s*)await page\.getByTestId\('invoice-row-(\d+)'\)\.click\(\);\s*$")
# Anything else that puts an invoice in the panel.
OPENS_PANEL = re.compile(r"getByTestId\('invoice-(new|lookup[\w-]*)'\)")
TEST_START = re.compile(r"^\s*test\(")
WAIT_LINE = re.compile(r"^\s*await expect\(page\.getByTestId\('invoice-panel-number'\)\)"
                       r"\.toHaveText\(await page\.getByTestId\('invoice-row-\d+'\)"
                       r"\.getByTestId\('invoice-number'\)\.innerText\(\)\);\s*$")
SEND_CLICK = re.compile(r"^(\s*)await page\.getByTestId\('invoice-send'\)\.click\(\);\s*$")
SEND_WAIT = "{ind}await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');"
SEND_WAIT_LINE = re.compile(r"^\s*await expect\(page\.getByTestId\('invoice-panel-status'\)\)"
                            r"\.not\.toHaveText\('Draft'\);\s*$")
# What ends the stretch after a send in which a check can still be the send's answer.
NEXT_ACTION = re.compile(r"\.(click|fill|check|uncheck|selectOption|press)\(|page\.goto\(|^\s*\}\);")
STATUS_CHECK = re.compile(r"getByTestId\('invoice-panel-status'\)\)\.(not\.)?toHaveText\('([^']*)'\)")
SEND_ERROR = re.compile(r"getByTestId\('invoice-send-error'\)")
WAIT = ("{ind}await expect(page.getByTestId('invoice-panel-number'))"
        ".toHaveText(await page.getByTestId('invoice-row-{id}').getByTestId('invoice-number').innerText());")


def active_from(path: str) -> int:
    """The checkpoint a spec file first runs at: its own number, or its copy directory's."""
    rel = os.path.relpath(path, SPECS)
    m = re.match(r"cp(\d+)", rel)
    return int(m.group(1))


def strip_waits(text: str) -> str:
    """The spec text without the waits, which is what the text-copy generators patch (their
    replacements are written against the authored text)."""
    return '\n'.join(l for l in text.split('\n') if not (WAIT_LINE.match(l) or SEND_WAIT_LINE.match(l)))


def send_answer(lines: list[str], i: int) -> str | None:
    """How the test after the send at lines[i] learns the send finished: 'sent' (a status other than
    Draft), 'refused' (the send error, or the status still Draft), or None when nothing it checks
    before its next action needs the answer."""
    for line in lines[i + 1:]:
        if NEXT_ACTION.search(line):
            return None
        if SEND_ERROR.search(line):
            return 'refused'
        m = STATUS_CHECK.search(line)
        if m:
            negated, status = bool(m.group(1)), m.group(2)
            return 'sent' if negated or status != 'Draft' else 'refused'
    return None


def add_waits(text: str, numbered: bool) -> tuple[str, list[int]]:
    """Insert a wait after every row click that may replace an open invoice. Returns the new text
    and, when the spec runs before invoice numbers exist, the line numbers it could not fix."""
    lines = text.split('\n')
    out, unfixable = [], []
    panel_open = False
    for i, line in enumerate(lines):
        if TEST_START.match(line):
            panel_open = False
        out.append(line)
        m = SEND_CLICK.match(line)
        if m and send_answer(lines, i) is None:
            out.append(SEND_WAIT.format(ind=m.group(1)))
        m = ROW_CLICK.match(line)
        if m:
            if panel_open:
                wait = WAIT.format(ind=m.group(1), id=m.group(2))
                nxt = lines[i + 1] if i + 1 < len(lines) else ''
                if not numbered:
                    unfixable.append(i + 1)
                elif nxt.strip() != wait.strip():
                    out.append(wait)
            panel_open = True
        elif OPENS_PANEL.search(line):
            panel_open = True
    return '\n'.join(out), unfixable


def main() -> int:
    changed, sites, sends, unfixable = 0, 0, 0, []
    for root, _, files in os.walk(SPECS):
        for f in sorted(files):
            if not f.endswith('.spec.ts'):
                continue
            path = os.path.join(root, f)
            with open(path) as fh:
                text = fh.read()
            new, bad = add_waits(text, active_from(path) >= NUMBERS_FROM)
            unfixable += [f"{os.path.relpath(path, SPECS)}:{n}" for n in bad]
            if new != text:
                sites += new.count("getByTestId('invoice-panel-number')).toHaveText(await") \
                    - text.count("getByTestId('invoice-panel-number')).toHaveText(await")
                sends += new.count(".not.toHaveText('Draft');") - text.count(".not.toHaveText('Draft');")
                changed += 1
                with open(path, 'w') as fh:
                    fh.write(new)
    print(f"panel_waits: {sites} wait(s) and {sends} send wait(s) added in {changed} file(s)")
    if unfixable:
        print("panel_waits: row clicks that may replace an open invoice before cp07 "
              "(no invoice number to wait on):\n  " + "\n  ".join(unfixable))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
