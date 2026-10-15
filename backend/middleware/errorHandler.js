export function notFound(req, res) {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
}

// eslint-disable-next-line no-unused-vars -- Express mengenali error handler dari 4 argumen.
export function errorHandler(err, req, res, next) {
  const status =
    Number(err.status || err.statusCode) ||
    (err.code === "LIMIT_FILE_SIZE"
      ? 413
      : err.code?.startsWith("LIMIT_")
        ? 400
        : err.code === "23505"
          ? 409
          : err.code === "23503" || err.code === "23514"
            ? 400
            : 500);

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    message:
      err.code === "23505"
        ? "Data sudah digunakan."
        : err.code === "23503" || err.code === "23514"
          ? "Data terkait tidak valid."
          : err.code === "LIMIT_FILE_SIZE"
            ? "Ukuran file maksimal 2 MB."
            : err.code?.startsWith("LIMIT_")
              ? "Permintaan unggah tidak valid."
            : status >= 500
              ? "Terjadi kesalahan pada server."
              : err.message || "Permintaan tidak valid.",
  });
}
