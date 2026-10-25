import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function ArticleImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  aspectRatio = "aspect-[16/9]",
  iconSize = "text-3xl",
  loading = "lazy",
}) {
  const [errorSrc, setErrorSrc] = useState(null);

  const hasImage = Boolean(src) && errorSrc !== src;

  return (
    <div
      className={`relative overflow-hidden ${aspectRatio} ${containerClassName}`}
    >
      {hasImage ? (
        <img
          src={src}
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
