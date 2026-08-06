#!/usr/bin/env node
// Copies every .env.example in this repo to a sibling .env, skipping any
// destination that already exists so a developer's edits are never clobbered.
// Usage: node scripts/setup-env.mjs   (or: npm run setup)

import { existsSync, copyFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  '.env.example',
  'backend/.env.example',
  'frontend/apps/tv-display/.env.example',
  'frontend/apps/mobile-web/.env.example',
  'frontend/apps/admin-dashboard/.env.example',
];

console.log('Setting up local .env files...\n');

let created = 0;
let skipped = 0;

for (const exampleRelPath of targets) {
  const examplePath = join(repoRoot, exampleRelPath);
  const envPath = examplePath.replace(/\.env\.example$/, '.env');
  const label = relative(repoRoot, envPath);

  if (!existsSync(examplePath)) {
    console.log(`  ! missing template: ${relative(repoRoot, examplePath)} (skipped)`);
    continue;
  }

  if (existsSync(envPath)) {
    console.log(`  = skipped  ${label}  (already exists)`);
    skipped++;
    continue;
  }

  copyFileSync(examplePath, envPath);
  console.log(`  + created  ${label}`);
  created++;
}

console.log(`\nDone. ${created} created, ${skipped} already present.`);
if (created > 0) {
  console.log('Review the newly created .env files and adjust any values before running the stack.');
}
