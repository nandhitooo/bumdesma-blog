// Judul halaman admin yang seragam: label kecil (grup menu), judul, satu
// deskripsi singkat, dan area aksi di kanan pada layar lebar.
export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 break-words text-2xl font-extrabold text-gray-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row sm:items-center">
          {children}
        </div>
      )}
    </header>
  );
}
