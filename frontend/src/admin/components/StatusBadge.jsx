const VARIANTS = {
  draft: {
    label: "Draf",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "fa-pen-to-square",
  },
  published: {
    label: "Terbit",
    className: "bg-green-50 text-green-800 border-green-200",
    icon: "fa-circle-check",
  },
  scheduled: {
    label: "Terjadwal",
    className: "bg-blue-50 text-blue-800 border-blue-200",
    icon: "fa-clock",
  },
};

// Label status artikel yang seragam di daftar maupun editor. `scheduled` dipakai
// untuk artikel terbit yang tanggal terbitnya masih di masa depan.
export default function StatusBadge({ status }) {
  const variant = VARIANTS[status] || VARIANTS.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${variant.className}`}
    >
      <i className={`fa-solid ${variant.icon}`} aria-hidden="true"></i>
      {variant.label}
    </span>
  );
}
