import podorukun from "../assets/podo-rukun.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

const About = () => {
  return (
    <section className="py-16 sm:py-24 bg-white" id="about">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
            Tentang BUMDESMA
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mt-2 mb-3">
            Membangun Kemandirian Ekonomi Desa
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Kecamatan Wilangan • Kabupaten Nganjuk • Jawa Timur
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Logo Column */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full max-w-xs p-8 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
              <img
                src={podorukun}
                alt="Logo BUMDESMA Podo Rukun"
                className="w-48 sm:w-56 h-auto object-contain"
              />
            </div>
          </div>

          {/* Copy Column */}
          <div className="lg:col-span-8 space-y-5 text-sm sm:text-base text-gray-700 leading-relaxed">
            <p>
              BUMDesma PODO RUKUN LKD bermula dari Program Pengembangan Kecamatan (PPK) yang berjalan bertahap sejak tahun 2003 hingga 2014, meliputi PPK Fase II Siklus 4 sampai Siklus 6, PPK Fase III, PPK PNPM, PNPM Generasi Sehat dan Cerdas, PNPM DSC, PNPM Open Menu, PNPM MP Optimalisasi, PNPM MP, serta PNPM MPD dengan total dana yang diterima Kecamatan Wilangan mencapai Rp 11.353.000.000.
            </p>
            <p>
              BUMDesa Bersama PODO RUKUN LKD telah memperoleh persetujuan dan pengesahan resmi dari Kementerian Hukum dan Hak Asasi Manusia Republik Indonesia melalui Sertifikat Pendaftaran Pendirian Badan Hukum Nomor AHU-00115.AH.01.35.Tahun 2022.
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Kantor beralamat di Dusun Wilangan RT 003 RW 001 Desa Wilangan, Kecamatan Wilangan, Kabupaten Nganjuk, Provinsi Jawa Timur.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    "https://drive.google.com/file/d/1EvypZ1A4ly4bN0URJ0BAASBzNXsf2AWJ/view?usp=sharing",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="inline-flex items-center gap-2.5 bg-brand-primary hover:bg-brand-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
              >
                <span>Unduh Dokumen Profil Resmi</span>
                <i className="fa-solid fa-file-pdf text-xs" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
