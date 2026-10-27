import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./api";
import { apiUrl } from "../lib/apiUrl";
import PageHeader from "./components/PageHeader";
import { useToast } from "./components/Toast";

const CONFIRMATION_WORD = "PULIHKAN";

function AdminBackup() {
  const { user } = useOutletContext();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [restoreNotice, setRestoreNotice] = useState("");
  const [counts, setCounts] = useState(null);
  const [revisionsCleared, setRevisionsCleared] = useState(0);
  const [failedFiles, setFailedFiles] = useState([]);

  // Pemeriksaan hak akses dilakukan sebelum panggilan API apa pun, mengikuti
  // pola halaman Kategori, supaya editor tidak memicu respons 403.
  if (user.role !== "admin") {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
        Akses ditolak. Backup dan pemulihan hanya tersedia untuk admin.
      </p>
    );
  }

  const downloadBackup = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      // Unduhan tidak lewat adminApi: respons berupa berkas, bukan JSON.
      const response = await fetch(apiUrl("/api/admin/backup/download"), {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || "Unduhan backup gagal. Coba lagi beberapa saat lagi.",
        );
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match ? match[1] : "bumdesma-backup.zip";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Objek URL dilepas setelah unduhan sempat dimulai.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.show("Backup berhasil diunduh.");
    } catch (requestError) {
      setDownloadError(requestError.message);
      toast.show(requestError.message, "error");
    } finally {
      setDownloading(false);
    }
  };

  const submitRestore = async (event) => {
    event.preventDefault();
    setRestoreError("");
    setRestoreNotice("");
    setCounts(null);
    setRevisionsCleared(0);
    setFailedFiles([]);

    if (!file) {
      setRestoreError("Pilih file backup (.zip) yang akan dipulihkan.");
      return;
    }
    if (!password) {
      setRestoreError("Isi password Anda untuk melanjutkan pemulihan.");
      return;
    }
    // Kolom kode hanya muncul bila /api/auth/me melaporkan 2FA aktif, dan
    // server tetap memverifikasinya sendiri.
    if (user.totpEnabled && !code.trim()) {
      setRestoreError("Isi kode verifikasi dari aplikasi authenticator Anda.");
      return;
    }
    if (confirmation !== CONFIRMATION_WORD) {
      setRestoreError(`Ketik ${CONFIRMATION_WORD} untuk mengonfirmasi.`);
      return;
    }

    const formData = new FormData();
    formData.append("backup", file);
    formData.append("password", password);
    if (user.totpEnabled) formData.append("code", code.trim());

    setRestoring(true);
    try {
      // adminApi menangani FormData tanpa menyetel Content-Type JSON.
      const result = await adminApi("/api/admin/backup/restore", {
        method: "POST",
        body: formData,
      });

      setRestoreNotice(result.message || "Backup berhasil dipulihkan.");
      toast.show(result.message || "Backup berhasil dipulihkan.");
      setCounts(result.counts ?? null);
      setRevisionsCleared(result.revisionsCleared ?? 0);
      setFailedFiles(result.failedFiles ?? []);

      // Formulir dikosongkan supaya isi backup tidak terkirim ulang tanpa sengaja.
      setFile(null);
      setPassword("");
      setCode("");
      setConfirmation("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (requestError) {
      setRestoreError(requestError.message);
    } finally {
      setRestoring(false);
    }
  };

  const inputClass =
    "min-h-[44px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-700";

  return (
    <section className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Sistem"
        title="Backup"
        description="Unduh salinan isi situs atau pulihkan dari berkas backup sebelumnya."
      />

      <div className="mb-7 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-extrabold text-gray-900">Unduh backup</h2>
        <p className="mt-2 text-gray-600">
          Backup berisi seluruh artikel, kategori, konten situs, dan gambar yang
          dipakai artikel, dalam satu file .zip. Akun pengguna dan password
          tidak ikut disimpan, sehingga pemulihan tidak akan mengunci admin dari
          panel.
        </p>

        {downloadError && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
            {downloadError}
          </p>
        )}

        <button
          type="button"
          onClick={downloadBackup}
          disabled={downloading}
          className="mt-5 min-h-[44px] w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60 sm:w-auto"
        >
          {downloading ? "Menyiapkan backup..." : "Unduh backup"}
        </button>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-extrabold text-gray-900">
          Pulihkan dari backup
        </h2>

        <div className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-bold">Perhatian: data saat ini akan diganti.</p>
          <p className="mt-1 text-sm">
            Pemulihan <strong>mengganti seluruh artikel, kategori, dan konten
            situs</strong> dengan isi backup. Sebelum mengganti, server menyimpan
            snapshot data terbaru di server (tiga snapshot terakhir disimpan).
            Gambar yang sudah ada tidak dihapus.
          </p>
          <p className="mt-2 text-sm">
            <strong>Riwayat revisi artikel juga akan dihapus</strong> karena
            revisi menempel pada artikel yang diganti. Riwayat ini tidak bisa
            dikembalikan dari backup.
          </p>
        </div>

        {restoreError && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
            {restoreError}
          </p>
        )}
        {restoreNotice && (
          <div
            role="status"
            className="mt-4 rounded-xl bg-green-50 p-4 text-green-800"
          >
            <p className="font-bold">{restoreNotice}</p>
            {counts && (
              <ul className="mt-2 list-inside list-disc text-sm">
                <li>{counts.categories} kategori</li>
                <li>{counts.articles} artikel</li>
                <li>{counts.siteContent} konten situs</li>
                <li>{counts.gallery} item galeri</li>
                <li>{counts.team} pengurus</li>
                <li>{counts.documents} dokumen</li>
                <li>{counts.serviceDetails} layanan</li>
                <li>{counts.faqs} FAQ</li>
                <li>{counts.files} gambar</li>
              </ul>
            )}
            {revisionsCleared > 0 && (
              <p className="mt-2 text-sm">
                Riwayat revisi dihapus: {revisionsCleared}
              </p>
            )}
            {failedFiles.length > 0 && (
              <p className="mt-2 break-words text-sm text-red-700">
                Gambar yang gagal ditulis: {failedFiles.join(", ")}. Data lain
                sudah dipulihkan; unggah ulang gambar tersebut bila perlu.
              </p>
            )}
          </div>
        )}

        <form onSubmit={submitRestore} className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="backup-file"
              className="mb-2 block font-bold text-gray-700"
            >
              File backup (.zip)
            </label>
            <input
              id="backup-file"
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="min-h-[44px] w-full cursor-pointer rounded-xl border border-gray-200 px-4 py-3 text-base file:mr-4 file:rounded-lg file:border-0 file:bg-green-700 file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-green-800"
            />
            <p className="mt-2 text-xs text-gray-500">
              Hanya file .zip hasil unduhan halaman ini yang didukung. Ukuran
              maksimal 100 MB.
            </p>
          </div>

          <div>
            <label
              htmlFor="restore-password"
              className="mb-2 block font-bold text-gray-700"
            >
              Password Anda
            </label>
            <input
              id="restore-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
            <p className="mt-2 text-xs text-gray-500">
              Diminta sebagai konfirmasi bahwa Anda benar-benar admin yang sedang
              login.
            </p>
          </div>

          {user.totpEnabled && (
            <div>
              <label
                htmlFor="restore-code"
                className="mb-2 block font-bold text-gray-700"
              >
                Kode verifikasi dua langkah
              </label>
              <input
                id="restore-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-gray-500">
                Akun Anda memakai verifikasi dua langkah. Masukkan kode 6 digit
                dari aplikasi authenticator.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="restore-confirmation"
              className="mb-2 block font-bold text-gray-700"
            >
              Ketik {CONFIRMATION_WORD} untuk mengonfirmasi
            </label>
            <input
              id="restore-confirmation"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={restoring || confirmation !== CONFIRMATION_WORD}
            className="min-h-[44px] w-full rounded-xl bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-800 disabled:opacity-60 sm:w-auto"
          >
            {restoring ? "Memulihkan..." : "Pulihkan data dari backup"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminBackup;
