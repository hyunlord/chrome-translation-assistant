import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Simple PNG creator (minimal valid PNG with solid color)
function createPNG(size, r, g, b) {
  // PNG header
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  ]);

  // IHDR chunk
  const width = size;
  const height = size;
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk (uncompressed image data)
  const rawData = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 3 + 1)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
    }
  }
  
  // Simple zlib wrapper (uncompressed deflate)
  const zlibData = Buffer.concat([
    Buffer.from([0x78, 0x01]), // zlib header (no compression)
    compressDeflate(rawData),
    adler32(rawData)
  ]);
  const idat = createChunk('IDAT', zlibData);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const combined = Buffer.concat([typeBuffer, data]);
  const crc = crc32(combined);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0);
  return Buffer.concat([length, combined, crcBuffer]);
}

function compressDeflate(data) {
  const chunks = [];
  const blockSize = 65535;
  let offset = 0;
  
  while (offset < data.length) {
    const remaining = data.length - offset;
    const size = Math.min(remaining, blockSize);
    const isLast = offset + size >= data.length;
    
    const header = Buffer.alloc(5);
    header[0] = isLast ? 1 : 0;
    header.writeUInt16LE(size, 1);
    header.writeUInt16LE(size ^ 0xFFFF, 3);
    
    chunks.push(header);
    chunks.push(data.slice(offset, offset + size));
    offset += size;
  }
  
  return Buffer.concat(chunks);
}

function adler32(data) {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  const result = Buffer.alloc(4);
  result.writeUInt32BE((b << 16) | a);
  return result;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return ~crc >>> 0;
}

// Create icons with a nice blue color (matching the extension theme)
const sizes = [16, 32, 48, 128];
const color = { r: 59, g: 130, b: 246 }; // Blue-500

sizes.forEach(size => {
  const png = createPNG(size, color.r, color.g, color.b);
  const path = join(iconsDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`Created: icon-${size}.png`);
});

console.log('✅ All placeholder icons created!');
