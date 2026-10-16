// Log satu baris per request: method, path, status, dan durasi.
//
// Body, cookie, header Authorization, dan query string sengaja tidak dicatat:
// body/cookie bisa memuat password atau token, sedangkan query string bisa
// memuat kata kunci pencarian pengguna.
export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const path = req.originalUrl.split("?")[0];
    console.log(
      `${req.method} ${path} ${res.statusCode} ${durationMs.toFixed(1)}ms`,
    );
  });

  next();
}
