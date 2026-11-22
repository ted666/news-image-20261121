// news-image-20261121: ship entry.png to /output/entry.png.
//
// The image is the front page for Saturday 21 November 2026, built offline
// and stored next to this file: lead story Iran/Bahrain, plus Kryvyi Rih,
// Chapo Isidro, the Nasdaq plunge and COP31. This program only copies it,
// unchanged, after proving it is a real PNG inside the competition's size
// gate. No network, no randomness: every run writes the same bytes.
//
// Local run:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_FILE_BYTES = 1024 * 1024; // 1 MiB
const MAX_SIDE_PX = 1024;

function die(msg: string): never {
  throw new Error(msg);
}

function checkPng(buf: Buffer, path: string): { width: number; height: number } {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    die(`${path}: not a PNG (bad magic bytes)`);
  }
  if (buf.length > MAX_FILE_BYTES) {
    die(`${path}: ${buf.length} bytes, over the 1 MiB limit`);
  }
  // IHDR carries width and height as big-endian uint32s at offsets 16 and 20.
  if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") {
    die(`${path}: missing IHDR chunk`);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width > MAX_SIDE_PX || height > MAX_SIDE_PX) {
    die(`${path}: ${width}x${height}, over the 1024x1024 limit`);
  }
  return { width, height };
}

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const dst = join(outDir, "entry.png");

const png = readFileSync(src);
const { width, height } = checkPng(png, src);

mkdirSync(outDir, { recursive: true });
writeFileSync(dst, png);

const back = readFileSync(dst);
if (!back.equals(png)) {
  die(`${dst}: read-back differs from ${src}`);
}

console.log(`entry.png -> ${dst} (${png.length} bytes, ${width}x${height})`);
