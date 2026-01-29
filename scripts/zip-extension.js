import { createWriteStream, existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { createGzip } from 'zlib';
import archiver from 'archiver';

const DIST_DIR = 'dist';
const OUTPUT_FILE = 'chrome-translation-assistant.zip';

async function createZip() {
  // Check if dist folder exists
  if (!existsSync(DIST_DIR)) {
    console.error('❌ Error: dist folder not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('📦 Creating ZIP file...');

  const output = createWriteStream(OUTPUT_FILE);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  output.on('close', () => {
    const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`✅ ZIP created successfully!`);
    console.log(`📁 File: ${OUTPUT_FILE}`);
    console.log(`📊 Size: ${sizeMB} MB`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Upload to GitHub Releases');
    console.log('2. Or submit to Chrome Web Store');
  });

  archive.on('error', (err) => {
    console.error('❌ Error creating ZIP:', err);
    process.exit(1);
  });

  archive.pipe(output);

  // Add all files from dist folder
  archive.directory(DIST_DIR, false);

  await archive.finalize();
}

createZip().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
