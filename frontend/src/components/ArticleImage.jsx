import { useEffect, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Nama berkas varian mengikuti berkas asli dengan akhiran "-<lebar>" sebelum
// ekstensi, sama seperti yang dibuat routes/upload.js.
function variantUrl(src, width) {
  const dot = src.lastIndexOf(".");
  if (dot === -1) return null;
  return `${src.slice(0, dot)}-${width}${src.slice(dot)}`;
}

export default function ArticleImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  aspectRatio = "aspect-[16/9]",
  iconSize = "text-3xl",
  loading = "lazy",
  sizes = "(min-width: 1024px) 768px, 100vw",
}) {
  const [errorSrc, setErrorSrc] = useState(null);
  // Berisi src yang sudah terbukti punya varian. Gambar lama (sebelum varian
  // dibuat) tidak punya berkas varian, jadi srcset tidak boleh dipakai begitu
  // saja: kandidat yang 404 akan tampil sebagai gambar rusak. Karena itu varian
  // terkecil dicoba dimuat lebih dulu, dan hanya bila berhasil srcset dipakai.
  const [variantsForSrc, setVariantsForSrc] = useState(null);

  useEffect(() => {
    if (!src || !src.startsWith("/uploads/")) return undefined;

    let active = true;
    const probe = new Image();
    probe.onload = () => {
      if (active) setVariantsForSrc(src);
    };
    probe.onerror = () => {
      // Tidak ada varian: biarkan <img> memakai berkas asli.
    };
    const smallest = variantUrl(src, 480);
    if (smallest) probe.src = smallest;

    return () => {
      active = false;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [src]);

  const hasImage = Boolean(src) && errorSrc !== src;
  const hasVariants = Boolean(src) && variantsForSrc === src;

  return (
    <div
      className={`relative overflow-hidden ${aspectRatio} ${containerClassName}`}
    >
      {hasImage ? (
        <img
          src={src}
          srcSet={
            hasVariants
              ? `${variantUrl(src, 480)} 480w, ${variantUrl(src, 960)} 960w, ${src} 1600w`
              : undefined
          }
          sizes={hasVariants ? sizes : undefined}
          alt={alt}
          loading={loading}
          decoding="async"
          onError={() => setErrorSrc(src)}
          className={`w-full h-full object-cover ${className}`}
        />
      ) : (
        <div
          className={`w-full h-full min-h-[140px] bg-brand-light flex items-center justify-center text-brand-primary ${iconSize} ${className}`}
          aria-hidden="true"
        >
          <i className="fa-regular fa-newspaper"></i>
        </div>
      )}
    </div>
  );
}
