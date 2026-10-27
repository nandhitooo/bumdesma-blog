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

test("processUploadedImage menolak gambar di atas 24 megapiksel dengan pesan resolusi", async () => {
  // 5200 x 5200 = 27,04 megapiksel. Warna solid membuat berkasnya tetap kecil
  // di disk, jadi yang diuji benar-benar batas piksel saat didekode, bukan
  // ukuran berkas.
  const input = await sharp({
    create: {
      width: 5200,
      height: 5200,
      channels: 3,
      background: "#ffffff",
    },
  })
    .png()
    .toBuffer();

  await assert.rejects(processUploadedImage(input), (error) => {
    assert.equal(error.status, 400);
    assert.equal(
      error.message,
      "Resolusi gambar terlalu besar (maksimal sekitar 24 megapiksel). Perkecil gambar lalu unggah ulang.",
    );
    return true;
  });
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
