import { spawnSync } from 'node:child_process';

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...opts,
  });
  return {
    code: res.status ?? 1,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
  };
}

function parseVitest(output) {
  const testsLine = output.split(/\r?\n/).find(l => l.includes('Tests') && l.includes('passed'));
  const filesLine = output.split(/\r?\n/).find(l => l.includes('Test Files') && l.includes('passed'));

  const tests = testsLine?.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
  const files = filesLine?.match(/Test Files\s+(\d+)\s+passed\s+\((\d+)\)/);

  return {
    testFilesPassed: files ? Number(files[1]) : null,
    testFilesTotal: files ? Number(files[2]) : null,
    testsPassed: tests ? Number(tests[1]) : null,
    testsTotal: tests ? Number(tests[2]) : null,
  };
}

function parseCoverage(output) {
  const lines = output.split(/\r?\n/);
  const allFiles = lines.find(l => l.trim().startsWith('All files'));
  if (!allFiles) return null;

  // Example:
  // All files          |    1.51 |    27.13 |   16.07 |    1.51 |
  const m = allFiles.match(/All files\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*\|/);
  if (!m) return null;
  return {
    statementsPct: Number(m[1]),
    branchesPct: Number(m[2]),
    functionsPct: Number(m[3]),
    linesPct: Number(m[4]),
  };
}

function parsePlaywright(output) {
  const lines = output.split(/\r?\n/);
  const passedLine = lines.slice().reverse().find(l => l.trim().match(/^\d+\s+passed\b/));
  const failedLine = lines.slice().reverse().find(l => l.trim().match(/^\d+\s+failed\b/));

  const passed = passedLine?.trim().match(/^(\d+)\s+passed/);
  const failed = failedLine?.trim().match(/^(\d+)\s+failed/);

  return {
    passed: passed ? Number(passed[1]) : 0,
    failed: failed ? Number(failed[1]) : 0,
  };
}

function killPort5174() {
  // Best-effort. macOS/Linux only.
  const r = run('bash', ['-lc', 'lsof -ti tcp:5174 | xargs -r kill -9']);
  return r.code === 0;
}

function printSection(title) {
  process.stdout.write(`\n=== ${title} ===\n`);
}

let overallOk = true;
const summary = {
  frontendUnit: null,
  frontendCoverage: null,
  e2e: null,
  backend: null,
};

// 0) Kill leftover dev server on port 5174
printSection('Prep');
killPort5174();

// 1) Frontend unit
printSection('Frontend unit (vitest run)');
{
  const r = run('npm', ['-C', 'frontend', 'run', 'test:once']);
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  const parsed = parseVitest(r.stdout + '\n' + r.stderr);
  summary.frontendUnit = { ok: r.code === 0, ...parsed };
  if (r.code !== 0) overallOk = false;
}

// 2) Frontend coverage
printSection('Frontend coverage (vitest --coverage)');
{
  const r = run('npm', ['-C', 'frontend', 'run', 'test:coverage']);
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  const cov = parseCoverage(r.stdout + '\n' + r.stderr);
  summary.frontendCoverage = { ok: r.code === 0, ...cov };
  if (r.code !== 0) overallOk = false;
}

// 3) E2E
printSection('E2E (playwright)');
{
  // Start fresh each time; config is responsible for starting webServer.
  const r = run('npx', ['playwright', 'test', '--workers=1', '--retries=0']);
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  const pw = parsePlaywright(r.stdout + '\n' + r.stderr);
  summary.e2e = { ok: r.code === 0, ...pw };
  if (r.code !== 0) overallOk = false;
}

// 4) Backend legacy suite
printSection('Backend (legacy ./backend/test_all.sh)');
{
  const r = run('bash', ['-lc', 'cd backend && ./test_all.sh']);
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  summary.backend = { ok: r.code === 0 };
  if (r.code !== 0) overallOk = false;
}

printSection('SUMMARY');
process.stdout.write(JSON.stringify(summary, null, 2) + '\n');

if (!overallOk) {
  process.exit(1);
}
