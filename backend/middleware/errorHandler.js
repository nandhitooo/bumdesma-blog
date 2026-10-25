export function notFound(req, res) {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
}

// Pesan body-parser (`entity.parse.failed`, `entity.too.large`) berisi detail
// internal parser. Terjemahkan ke pesan yang aman untuk klien.
function bodyParserMessage(err) {
  if (err.type === "entity.parse.failed") return "Body JSON tidak valid.";
  if (err.type === "entity.too.large") return "Ukuran permintaan terlalu besar.";
  return null;
}

function statusFor(err) {
  return (
    Number(err.status || err.statusCode) ||
    (err.code === "LIMIT_FILE_SIZE"
      ? 413
      : typeof err.code === "string" && err.code.startsWith("LIMIT_")
        ? 400
        : err.code === "23505"
          ? 409
          : err.code === "23503" || err.code === "23514"
            ? 400
            : 500)
  );
}

function messageFor(err, status) {
  const bodyMessage = bodyParserMessage(err);
  if (bodyMessage) return bodyMessage;

  if (err.code === "23505") return "Data sudah digunakan.";
  if (err.code === "23503" || err.code === "23514") return "Data terkait tidak valid.";
  if (err.code === "LIMIT_FILE_SIZE") return "Ukuran file maksimal 2 MB.";
  if (typeof err.code === "string" && err.code.startsWith("LIMIT_")) {
    return "Permintaan unggah tidak valid.";
  }
  if (status >= 500) return "Terjadi kesalahan pada server.";
  return err.message || "Permintaan tidak valid.";
}

// eslint-disable-next-line no-unused-vars -- Express mengenali error handler dari 4 argumen.
export function errorHandler(err, req, res, next) {
  const status = statusFor(err);

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ message: messageFor(err, status) });
}
