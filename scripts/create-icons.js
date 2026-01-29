/**
 * Create placeholder icons for Chrome extension
 * Uses sharp for image generation
 */

import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes for Chrome extension
const sizes = [16, 32, 48, 128];

// Blue color matching the extension theme (#3b82f6)
const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#3b82f6"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        fill="white" font-family="Arial, sans-serif" font-weight="bold"
        font-size="${Math.round(size * 0.5)}">T</text>
</svg>`;

async function createIcons() {
  for (const size of sizes) {
    const svg = svgTemplate(size);
    const outputPath = join(iconsDir, `icon-${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`Created: icon-${size}.png`);
  }

  console.log('✅ All icons created successfully!');
}

createIcons().catch(console.error);
