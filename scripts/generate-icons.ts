// Generate placeholder PNG icons for the Chrome extension
// Uses a simple 1-pixel-per-channel raw PNG encoder

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateRawSync } from "node:zlib";

const iconsDir = resolve(import.meta.dir, "../extension/icons");
mkdirSync(iconsDir, { recursive: true });

function createPNG(size: number): Buffer {
	// Create a simple PNG with a dark background and an "S" shape using bright pixels
	const width = size;
	const height = size;

	// RGBA pixel data
	const pixels = new Uint8Array(width * height * 4);

	// Fill with dark background (#0a0a0a)
	for (let i = 0; i < pixels.length; i += 4) {
		pixels[i] = 10; // R
		pixels[i + 1] = 10; // G
		pixels[i + 2] = 10; // B
		pixels[i + 3] = 255; // A
	}

	// Draw a simple colored square border (electric blue #3b82f6)
	const border = Math.max(1, Math.floor(size / 8));
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const isBorder =
				x < border || x >= width - border || y < border || y >= height - border;
			if (isBorder) {
				const idx = (y * width + x) * 4;
				pixels[idx] = 59; // R
				pixels[idx + 1] = 130; // G
				pixels[idx + 2] = 246; // B
				pixels[idx + 3] = 255; // A
			}
		}
	}

	// Draw "S" letter in center (white)
	const cx = Math.floor(width / 2);
	const cy = Math.floor(height / 2);
	const r = Math.floor(size / 3);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const dx = x - cx;
			const dy = y - cy;

			// Simple S shape: top arc right, bottom arc left
			const inCenter = Math.abs(dx) < r * 0.7 && Math.abs(dy) < r * 0.15;
			const inTop =
				dy < 0 &&
				dy > -r * 0.6 &&
				dx > -r * 0.5 &&
				dx < r * 0.7 &&
				Math.abs(dy + r * 0.3) < r * 0.35 &&
				!(dx < 0 && dy > -r * 0.2);
			const inBottom =
				dy > 0 &&
				dy < r * 0.6 &&
				dx < r * 0.5 &&
				dx > -r * 0.7 &&
				Math.abs(dy - r * 0.3) < r * 0.35 &&
				!(dx > 0 && dy < r * 0.2);

			if (inCenter || inTop || inBottom) {
				const idx = (y * width + x) * 4;
				pixels[idx] = 255;
				pixels[idx + 1] = 255;
				pixels[idx + 2] = 255;
				pixels[idx + 3] = 255;
			}
		}
	}

	// Encode as PNG using raw zlib
	// This is a minimal PNG encoder
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

	function crc32(buf: Buffer): number {
		let c = 0xffffffff;
		for (const byte of buf) {
			c ^= byte;
			for (let j = 0; j < 8; j++) {
				c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
			}
		}
		return (c ^ 0xffffffff) >>> 0;
	}

	function chunk(type: string, data: Buffer): Buffer {
		const len = Buffer.alloc(4);
		len.writeUInt32BE(data.length);
		const typeBuffer = Buffer.from(type, "ascii");
		const combined = Buffer.concat([typeBuffer, data]);
		const crc = Buffer.alloc(4);
		crc.writeUInt32BE(crc32(combined));
		return Buffer.concat([len, combined, crc]);
	}

	// IHDR
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // color type RGBA
	ihdr[10] = 0; // compression
	ihdr[11] = 0; // filter
	ihdr[12] = 0; // interlace

	// IDAT - raw pixel data with filter bytes
	const rawData = Buffer.alloc(height * (1 + width * 4));
	for (let y = 0; y < height; y++) {
		rawData[y * (1 + width * 4)] = 0; // filter: none
		for (let x = 0; x < width * 4; x++) {
			rawData[y * (1 + width * 4) + 1 + x] = pixels[y * width * 4 + x];
		}
	}

	const deflated = deflateRawSync(rawData, { level: 6 });

	// Wrap in zlib format (header + deflated + adler32)
	const zlibHeader = Buffer.from([0x78, 0x9c]);

	// Adler32
	let a = 1;
	let b = 0;
	for (const value of rawData) {
		a = (a + value) % 65521;
		b = (b + a) % 65521;
	}
	const adler = Buffer.alloc(4);
	adler.writeUInt32BE(((b << 16) | a) >>> 0);

	const compressedData = Buffer.concat([zlibHeader, deflated, adler]);

	// IEND
	const iend = Buffer.alloc(0);

	return Buffer.concat([
		signature,
		chunk("IHDR", ihdr),
		chunk("IDAT", compressedData),
		chunk("IEND", iend),
	]);
}

for (const size of [16, 32, 48, 128]) {
	const png = createPNG(size);
	const path = resolve(iconsDir, `icon-${size}.png`);
	writeFileSync(path, png);
	// biome-ignore lint/suspicious/noConsole: build script
	console.log(`Generated ${path} (${png.length} bytes)`);
}
