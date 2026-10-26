// Kerangka konten saat data dimuat, supaya tata letak tidak melompat dan
// pengguna tetap melihat bahwa halaman sedang bekerja.
export default function LoadingSkeleton({ rows = 4, label = "Memuat data..." }) {
  return (
    <div className="p-5 sm:p-6" aria-busy="true">
      <p className="sr-only" role="status">
        {label}
      </p>
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="w-full space-y-2">
              <div className="admin-skeleton h-4 w-2/3 rounded-full"></div>
              <div className="admin-skeleton h-3 w-1/3 rounded-full"></div>
            </div>
            <div className="admin-skeleton h-10 w-full rounded-xl sm:w-24"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
