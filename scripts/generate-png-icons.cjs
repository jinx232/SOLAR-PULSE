'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// Simple CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makePng(width, height, renderPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Header
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc32(Buffer.concat([ihdrType, ihdrData])));
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13);
  const ihdrChunk = Buffer.concat([ihdrLength, ihdrType, ihdrData, ihdrCrc]);

  // IDAT
  const idatType = Buffer.from('IDAT');
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(Buffer.concat([idatType, deflated])));
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(deflated.length);
  const idatChunk = Buffer.concat([idatLength, idatType, deflated, idatCrc]);

  // IEND
  const iendType = Buffer.from('IEND');
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(iendType));
  const iendLength = Buffer.alloc(4);
  iendLength.writeUInt32BE(0);
  const iendChunk = Buffer.concat([iendLength, iendType, iendCrc]);

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function renderSolarIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background rounded square
  const cornerRadius = w * 0.2;
  const inBox = Math.abs(dx) <= (cx - cornerRadius) || Math.abs(dy) <= (cy - cornerRadius) ||
    Math.hypot(Math.abs(dx) - (cx - cornerRadius), Math.abs(dy) - (cy - cornerRadius)) <= cornerRadius;

  if (!inBox) {
    return [0, 0, 0, 0]; // Transparent outside icon bounds
  }

  // Central Sun disk: radius = w * 0.22
  const sunRadius = w * 0.22;
  if (dist <= sunRadius) {
    return [249, 115, 22, 255]; // #f97316
  }

  // Sun Rays: 8 rays
  const angle = Math.atan2(dy, dx); // [-PI, PI]
  const rayAngleSpacing = Math.PI / 4; // 8 rays
  const normalizedAngle = ((angle % rayAngleSpacing) + rayAngleSpacing) % rayAngleSpacing;
  const rayDistToCenter = Math.abs(normalizedAngle - rayAngleSpacing / 2);
  const rayInner = w * 0.28;
  const rayOuter = w * 0.40;
  const rayWidth = 0.08;

  if (dist >= rayInner && dist <= rayOuter && (rayDistToCenter < rayWidth || Math.abs(rayDistToCenter - rayAngleSpacing / 2) < rayWidth)) {
    return [250, 204, 21, 255]; // #facc15
  }

  // Background color #070b13
  return [7, 11, 19, 255];
}

const publicDir = path.resolve(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), makePng(192, 192, renderSolarIcon));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), makePng(512, 512, renderSolarIcon));
console.log('Successfully generated public/icon-192.png and public/icon-512.png');
