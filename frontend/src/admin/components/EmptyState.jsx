// Keadaan kosong yang menjelaskan kenapa daftar kosong dan apa langkah
// berikutnya, bukan sekadar "Belum ada data".
export default function EmptyState({ icon = "inbox", title, description, children }) {
  return (
    <div className="px-5 py-12 text-center sm:px-6 sm:py-14">
      <span
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-lg text-green-800"
        aria-hidden="true"
      >
        <i className={`fa-solid fa-${icon}`}></i>
      </span>
      <h2 className="mt-4 break-words text-lg font-extrabold text-gray-900">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md break-words text-sm leading-relaxed text-gray-600">
          {description}
        </p>
      )}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
