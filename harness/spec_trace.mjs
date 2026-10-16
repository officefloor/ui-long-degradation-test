// Records what each Playwright test in a spec DOES, without a browser (harness/spec_check.py).
//
// Input on stdin: a JSON list of spec file paths. Output on stdout: a JSON list, one entry per spec,
// { path, tests: [{ title, events: [...], error? }], error? }.
//
// The spec is run for real in node with its imports replaced by recording stand-ins: `test` registers
// the test bodies, `page` hands out locators that remember their chain of selectors, and `expect`
// records each assertion instead of checking it. Loops, local consts, row helpers and template ids are
// therefore all resolved by node itself; the Python side only replays the resulting event list against
// the reference model (harness/oracle). Nothing here knows about the worksheet.
//
// Events:
//   { op: 'seed', fixture }                      resetAndSeed(...)
//   { op: 'goto', url } | { op: 'reload' }
//   { op: 'fill' | 'click' | 'select' | ..., loc, value? }
//   { op: 'expect', loc, matcher, value, not }   a locator assertion
//   { op: 'audit', matcher, value, not }         an assertion on auditLines()
//   { op: 'unknown', what }                      anything the recorder cannot represent
// A locator is a list of steps: { tid } | { tidRe } | { first: true } | { nth } | { last: true } |
// { has: <locator> } | { hasText } | { text, exact }.
// getAttribute returns a placeholder string `\u0001ATTR<n>|<prefix stripped>\u0001` resolved on the
// Python side against event `attr` n ({ op: 'attr', n, loc, name }).
import { readFileSync } from 'node:fs';

const AUDIT = Symbol('auditLines');

// The few TypeScript forms the specs use (this node has no type stripping): annotated consts, typed
// arrow parameters and the non-null `!`. Anything else fails to parse, and the spec is then reported as
// unverified rather than skipped.
function stripTypes(src) {
  return src
    .replace(/\b(const|let|var)\s+(\w+)\s*:\s*[^=;]+?=(?![=>])/g, '$1 $2 =')
    .replace(/([(,]\s*\w+)\s*:\s*(?:number|string|boolean|any|unknown)\b(?=\s*[,)])/g, '$1')
    .replace(/\)!\./g, ').');
}

function reText(v) {
  return v instanceof RegExp ? { re: v.source, flags: v.flags } : v;
}

function makeRecorder() {
  const events = [];
  let attrs = 0;

  class Locator {
    constructor(steps) { this.steps = steps; }
    _with(step) { return new Locator([...this.steps, step]); }
    getByTestId(id) { return this._with(id instanceof RegExp ? { tidRe: id.source } : { tid: String(id) }); }
    getByText(text, opts = {}) { return this._with({ text: reText(text), exact: !!opts.exact }); }
    first() { return this._with({ first: true }); }
    last() { return this._with({ last: true }); }
    nth(n) { return this._with({ nth: n }); }
    filter(opts = {}) {
      const step = {};
      if (opts.has) step.has = opts.has.steps;
      if (opts.hasText !== undefined) step.hasText = reText(opts.hasText);
      return this._with(step);
    }
    locator(sel) { return this._with({ css: String(sel) }); }
    async click() { events.push({ op: 'click', loc: this.steps }); }
    async dblclick() { events.push({ op: 'unknown', what: 'dblclick', loc: this.steps }); }
    async fill(value) { events.push({ op: 'fill', loc: this.steps, value: String(value) }); }
    async clear() { events.push({ op: 'fill', loc: this.steps, value: '' }); }
    async check() { events.push({ op: 'check', loc: this.steps, value: true }); }
    async uncheck() { events.push({ op: 'check', loc: this.steps, value: false }); }
    async press(key) { events.push({ op: 'unknown', what: `press ${key}`, loc: this.steps }); }
    async selectOption(value) {
      events.push({ op: 'select', loc: this.steps, value: typeof value === 'object' ? value : { value: String(value) } });
    }
    async getAttribute(name) {
      const n = ++attrs;
      events.push({ op: 'attr', n, loc: this.steps, name });
      return {
        replace(a, b) { return `\u0001ATTR${n}|${a}|${b}\u0001`; },
        toString() { return `\u0001ATTR${n}||\u0001`; },
      };
    }
    async textContent() { events.push({ op: 'unknown', what: 'textContent', loc: this.steps }); return ''; }
    async innerText() { events.push({ op: 'unknown', what: 'innerText', loc: this.steps }); return ''; }
    async count() { events.push({ op: 'unknown', what: 'count', loc: this.steps }); return 0; }
  }

  const page = new Locator([]);
  page.goto = async (url) => { events.push({ op: 'goto', url }); };
  page.reload = async () => { events.push({ op: 'reload' }); };
  page.waitForTimeout = async () => {};
  page.waitForLoadState = async () => {};

  function expectFn(target) {
    const make = (not) => new Proxy({}, {
      get(_, matcher) {
        if (matcher === 'not') return make(!not);
        if (matcher === 'then') return undefined;
        return (value, ...rest) => {
          if (target === AUDIT || (Array.isArray(target) && target[AUDIT])) {
            events.push({ op: 'audit', matcher, value: reText(value), not });
          } else if (target instanceof Locator) {
            events.push({ op: 'expect', loc: target.steps, matcher, value: reText(value), not, opts: rest[0] });
          } else {
            events.push({ op: 'unknown', what: `expect(${typeof target}).${String(matcher)}` });
          }
          return Promise.resolve();
        };
      },
    });
    return make(false);
  }
  expectFn.soft = expectFn;

  return { events, page, expect: expectFn };
}

function auditLines() {
  const a = [];
  a[AUDIT] = true;
  return a;
}

async function traceSpec(path) {
  const src = readFileSync(path, 'utf8');
  const body = stripTypes(src.replace(/^\s*import\s[^;]*;\s*$/gm, ''));
  const tests = [];
  let current = null;
  const test = (title, a, b) => { tests.push({ title, fn: typeof a === 'function' ? a : b }); };
  test.describe = (name, a, b) => { (typeof a === 'function' ? a : b)(); };
  test.describe.serial = test.describe;
  test.skip = () => {};
  test.only = test;
  test.beforeEach = (fn) => { current = fn; };
  test.afterEach = () => {};
  // eslint-disable-next-line no-new-func
  const run = new Function('test', 'expect', 'resetAndSeed', 'auditLines', body);
  let seedHook = null;
  run(test, (...a) => seedHook.expect(...a), (fx) => seedHook.seed(fx), auditLines);
  const out = [];
  for (const t of tests) {
    const rec = makeRecorder();
    seedHook = {
      expect: rec.expect,
      seed: async (fx) => { rec.events.push({ op: 'seed', fixture: JSON.parse(JSON.stringify(fx)) }); },
    };
    const entry = { title: t.title, events: rec.events };
    try {
      if (current) await current({ page: rec.page });
      await t.fn({ page: rec.page });
    } catch (e) {
      entry.error = String(e && e.message || e).slice(0, 300);
    }
    out.push(entry);
  }
  return { path, tests: out };
}

const paths = JSON.parse(readFileSync(0, 'utf8'));
const results = [];
for (const p of paths) {
  try {
    results.push(await traceSpec(p));
  } catch (e) {
    results.push({ path: p, tests: [], error: String(e && e.message || e).slice(0, 500) });
  }
}
process.stdout.write(JSON.stringify(results));
