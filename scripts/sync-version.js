/**
 * Sync version from package.json to manifest.json
 * Used during CI/CD to ensure version consistency
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const packageJsonPath = join(rootDir, 'package.json');
const manifestJsonPath = join(rootDir, 'public', 'manifest.json');

try {
  // Read package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  // Read manifest.json
  const manifestJson = JSON.parse(readFileSync(manifestJsonPath, 'utf8'));

  // Update version
  const oldVersion = manifestJson.version;
  manifestJson.version = version;

  // Write back manifest.json
  writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n', 'utf8');

  console.log(`✅ Version synced: ${oldVersion} → ${version}`);
  console.log(`   package.json: ${version}`);
  console.log(`   manifest.json: ${version}`);
} catch (error) {
  console.error('❌ Error syncing version:', error.message);
  process.exit(1);
}
