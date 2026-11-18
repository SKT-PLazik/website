#!/usr/bin/env bun
/**
 * Derive the next SemVer version from conventional commits.
 *
 * Usage: bun scripts/version.mjs [--base <git-ref>] [--pr <number>]
 *
 * Rules (since the last `vX.Y.Z` tag, or the PR base when given):
 *   `!` / `BREAKING CHANGE:`  -> major
 *   `feat:`                  -> minor
 *   `fix:` / `perf:` / `revert:` / `refactor:` -> patch
 *   everything else          -> no release
 *
 * PRs always produce a prerelease, suffixed with `-pr<number>`.
 * Results are written to stdout and to GITHUB_OUTPUT when running in Actions.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const CONVENTIONAL = /^([a-z]+)(!)?(?:\([^)]+\))?!?:\s+.+/;
const PATCH_TYPES = new Set(['fix', 'perf', 'revert', 'refactor']);
const RANK = { none: 0, patch: 1, minor: 2, major: 3 };

const argv = process.argv.slice(2);
function arg(name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}
const prNumber = arg('--pr');
const baseRef = arg('--base');

function git(args, allowFailure = false) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) return '';
    throw error;
  }
}

function compareSemver(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

const latest = git(['tag', '--list', 'v*'])
  .split('\n')
  .map((tag) => tag.trim().replace(/^v/, ''))
  .filter((version) => SEMVER.test(version))
  .sort(compareSemver)
  .at(-1) ?? null;

let range;
if (baseRef) {
  const mergeBase = git(['merge-base', 'HEAD', baseRef], true);
  range = mergeBase ? `${mergeBase}..HEAD` : (latest ? `v${latest}..HEAD` : 'HEAD');
} else {
  range = latest ? `v${latest}..HEAD` : 'HEAD';
}

let bump = 'none';
for (const message of git(['log', '--format=%B%x1e', range]).split('\x1e')) {
  const lines = message.trim().split('\n');
  if (!lines[0]) continue;

  const match = CONVENTIONAL.exec(lines[0]);
  const breaking = Boolean(match?.[2]) || lines.some((line) => /^BREAKING[ -]CHANGE:\s/.test(line));

  let commitBump = 'none';
  if (breaking) commitBump = 'major';
  else if (match?.[1] === 'feat') commitBump = 'minor';
  else if (match && PATCH_TYPES.has(match[1])) commitBump = 'patch';

  if (RANK[commitBump] > RANK[bump]) bump = commitBump;
}

const declared = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const initial = SEMVER.test(declared ?? '') ? declared : '0.0.0';
const [major, minor, patch] = (latest ?? initial).split('.').map(Number);
let next;
if (bump === 'major') next = `${major + 1}.0.0`;
else if (bump === 'minor') next = `${major}.${minor + 1}.0`;
else if (bump === 'patch') next = `${major}.${minor}.${patch + 1}`;
else next = latest ?? initial;

const isPr = Boolean(prNumber);
const outputs = {
  version: isPr ? `${next}-pr${prNumber}` : next,
  base_version: latest ?? initial,
  bump,
  should_release: String(isPr || bump !== 'none' || !latest),
  is_pr: String(isPr),
};

if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`).join(''),
    { flag: 'a' },
  );
}

console.log(`Version: ${outputs.version} (base: ${outputs.base_version}, bump: ${bump}, release: ${outputs.should_release})`);
