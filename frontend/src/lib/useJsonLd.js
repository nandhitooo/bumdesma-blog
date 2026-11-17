import { useEffect } from "react";

// Menyisipkan satu blok JSON-LD ke <head> selama komponen masih tampil. Struktur
// datanya disusun pemanggil; hook hanya mengurus pembuatan tag script dan
// menghapusnya lagi saat unmount supaya blok antarhalaman tidak menumpuk.
export function useJsonLd(data) {
  // Dibandingkan sebagai string supaya efek tidak dijalankan ulang hanya karena
  // objek data dibuat baru pada setiap render.
  const json = data ? JSON.stringify(data) : "";

  useEffect(() => {
    if (!json) return undefined;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = json;
    document.head.appendChild(script);
    return () => script.remove();
  }, [json]);
}
