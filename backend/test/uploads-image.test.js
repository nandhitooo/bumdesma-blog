import { randomBytes } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { detectImage, processUploadedImage } from "../services/uploads.js";

test("processUploadedImage menghasilkan WebP <= 1600 px dan lebih kecil dari input", async () => {
  const width = 3000;
  const height = 2000;
  // Piksel acak membuat PNG benar-benar besar, sehingga perbandingan ukuran
  // hasil konversi tidak bergantung pada pola gambar yang mudah dikompresi.
  const pixels = randomBytes(width * height * 3);
  const input = await sharp(pixels, {
    raw: { width, height, channels: 3 },
  })
    .png()
    .toBuffer();

  const { buffer, extension } = await processUploadedImage(input);

  assert.equal(extension, "webp");

  const detected = detectImage(buffer);
  assert.ok(detected, "hasil harus dikenali detectImage");
  assert.equal(detected.mime, "image/webp");

  const metadata = await sharp(buffer).metadata();
  assert.ok(metadata.width <= 1600, `lebar ${metadata.width} harus <= 1600`);
  assert.ok(buffer.length < input.length, "hasil harus lebih kecil dari input");
});

test("processUploadedImage menolak buffer sampah dengan status 400", async () => {
  await assert.rejects(
    processUploadedImage(Buffer.from("bukan gambar sama sekali")),
    (error) => {
      assert.equal(error.status, 400);
      assert.equal(error.message, "Gambar tidak dapat diproses.");
      return true;
    },
  );
});
