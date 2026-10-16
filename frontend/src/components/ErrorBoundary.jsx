import { Component } from "react";

// Menangkap error render supaya pengguna tidak melihat halaman kosong tanpa
// penjelasan. `resetKey` (pathname) membuat pembatas ini mencoba merender ulang
// begitu pengguna berpindah halaman.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error("Gagal menampilkan halaman:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-16">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Halaman ini gagal ditampilkan
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Terjadi kesalahan saat memuat halaman. Coba muat ulang, atau kembali ke
            beranda untuk melanjutkan.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Muat ulang halaman
            </button>
            <a
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
