"""A run's two log files, work_root/runs/<run_id>/run.log and test.log.

    run.log   everything the run process prints (its own lines, the agent's streamed turns, and
              anything a child process writes): tee_output copies the process's stdout and stderr
              to the file at the file-descriptor level, so the terminal that started the run still
              shows it all as it happens.
    test.log  everything the run's test processor prints (harness.gate_queue): each job's start,
              its steps, every test as Playwright finishes it, and the result. The processor
              writes only there (redirect_output), however it was started, so its progress is
              followed with `tail -f`.

Both are appended to, so a resumed run continues the same files.
"""
from __future__ import annotations

import atexit
import os
import sys
import threading
from datetime import datetime

RUN_LOG = "run.log"
TEST_LOG = "test.log"


def _header(fh, what: str) -> None:
    fh.write(f"\n===== {what} — pid {os.getpid()} — {datetime.now():%Y-%m-%d %H:%M:%S} =====\n"
             .encode())


def tee_output(path: str, what: str) -> None:
    """From here on, everything written to this process's stdout or stderr — by Python or by any
    child that inherits them — goes to the terminal AND is appended to `path`. A closed terminal
    does not stop the log."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    log = open(path, "ab", buffering=0)
    _header(log, what)
    sys.stdout.flush()
    sys.stderr.flush()
    term = os.dup(1)
    term_err = os.dup(2)
    r, w = os.pipe()
    os.dup2(w, 1)
    os.dup2(w, 2)
    os.close(w)
    state = {"term": True}

    def pump() -> None:
        while True:
            try:
                b = os.read(r, 65536)
            except OSError:
                break
            if not b:
                break
            if state["term"]:
                try:
                    os.write(term, b)
                except OSError:            # the terminal went away; keep logging
                    state["term"] = False
            log.write(b)

    t = threading.Thread(target=pump, name="run.log tee", daemon=True)
    t.start()

    def finish() -> None:
        try:
            sys.stdout.flush()
            sys.stderr.flush()
        except (OSError, ValueError):
            pass
        os.dup2(term, 1)            # drops this process's ends of the pipe ...
        os.dup2(term_err, 2)
        t.join(timeout=5)           # ... so the pump drains what is left and stops

    atexit.register(finish)


def redirect_output(path: str, what: str) -> None:
    """Send this process's stdout and stderr (and its children's) to `path` only, appended."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sys.stdout.flush()
    sys.stderr.flush()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    os.write(fd, f"\n===== {what} — pid {os.getpid()} — {datetime.now():%Y-%m-%d %H:%M:%S} =====\n"
             .encode())
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    os.close(fd)
