#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const VERSION = process.argv[2];
if (!VERSION) {
  console.error('Usage: node scripts/create-release.mjs <version>');
  console.error('Example: node scripts/create-release.mjs v1.0.0');
  process.exit(1);
}

// Validate version format
if (!VERSION.startsWith('v')) {
  console.error('Version must start with "v" (e.g., v1.0.0)');
  process.exit(1);
}

console.log(`🚀 Creating MDReader release ${VERSION}`);

// Update version in package.json
const packagePath = join('frontend', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
packageJson.version = VERSION.slice(1); // Remove 'v' prefix
writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

// Update version in tauri.conf.json
const tauriConfigPath = join('frontend', 'src-tauri', 'tauri.conf.json');
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf8'));
tauriConfig.version = VERSION.slice(1);
writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2));

// Update version in Cargo.toml
const cargoPath = join('frontend', 'src-tauri', 'Cargo.toml');
let cargoContent = readFileSync(cargoPath, 'utf8');
cargoContent = cargoContent.replace(/version = "[^"]*"/, `version = "${VERSION.slice(1)}"`);
writeFileSync(cargoPath, cargoContent);

console.log('✅ Updated version numbers across all config files');

// Create git tag
execSync(`git add . && git commit -m "Release ${VERSION}"`, { stdio: 'inherit' });
execSync(`git tag ${VERSION}`, { stdio: 'inherit' });
execSync(`git push origin main ${VERSION}`, { stdio: 'inherit' });

console.log(`✅ Created and pushed git tag ${VERSION}`);
console.log('\n📋 Next steps:');
console.log('1. Go to https://github.com/yourusername/mdreader/releases');
console.log('2. Click "Draft a new release"');
console.log(`3. Select tag ${VERSION}`);
console.log('4. Add release notes');
console.log('5. The GitHub Action will automatically build and attach binaries');