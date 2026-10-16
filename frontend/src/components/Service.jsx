import "@fortawesome/fontawesome-free/css/all.min.css";

const services = [
  {
    icon: "fa-coins",
    title: "Dana Bergulir Masyarakat",
    desc: "Penyediaan modal usaha berkelanjutan bagi kelompok masyarakat desa guna meningkatkan kemandirian ekonomi dan kesejahteraan keluarga.",
  },
  {
    icon: "fa-credit-card",
    title: "Pembelian Kredit",
    desc: "Layanan pembelian barang secara kredit dengan syarat mudah dan cicilan terjangkau untuk kebutuhan usaha maupun rumah tangga.",
  },
  {
    icon: "fa-building-columns",
    title: "Keagenan Bank",
    desc: "Layanan tarik tunai, transfer, dan pembayaran tagihan tanpa perlu ke bank.",
  },
  {
    icon: "fa-bus-simple",
    title: "Penyewaan Elf",
    desc: "Sewa armada Elf dengan driver berpengalaman untuk perjalanan dalam dan luar kota.",
  },
  {
    icon: "fa-landmark",
    title: "PT. LKM",
    desc: "Layanan keuangan mikro desa untuk mendukung pertumbuhan ekonomi melalui pembiayaan dan pendampingan usaha.",
  },
];

const Service = () => {
  return (
    <section className="py-16 sm:py-24 bg-gray-50 border-t border-gray-200" id="services">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-semibold tracking-wider text-brand-primary uppercase">
            Unit Usaha
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mt-2 mb-3">
            Layanan Kami
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Berbagai layanan profesional untuk mendukung pertumbuhan ekonomi dan kemandirian masyarakat desa.
          </p>
        </div>

        {/* Max 3 columns grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-6 sm:p-7 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary mb-5">
                  <i className={`fa-solid ${service.icon} text-lg`} aria-hidden="true"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {service.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Service;
