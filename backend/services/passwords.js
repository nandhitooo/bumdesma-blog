// bcrypt hanya memakai 72 byte pertama password, jadi nilai yang lebih panjang
// dipotong diam-diam: dua password berbeda yang 72 byte pertamanya sama akan
// dianggap identik. Batas ini juga menahan body besar yang tidak ada gunanya.
export const PASSWORD_MAX_BYTES = 72;

export function passwordTooLongMessage() {
  return `Password maksimal ${PASSWORD_MAX_BYTES} byte.`;
}

// Dipasang setelah aturan panjang karakter: zod tidak menjalankan refine bila
// aturan dasarnya sudah gagal, sehingga pesan pertama yang tampil tetap yang
// paling relevan (mis. "Password minimal 8 karakter.").
export function withPasswordByteLimit(schema) {
  return schema.refine(
    (value) => Buffer.byteLength(value, "utf8") <= PASSWORD_MAX_BYTES,
    { message: passwordTooLongMessage() },
  );
}
