/**
 * components/home/EdukasiKlinis.tsx — OneHealth.AI
 * Section edukasi pasien (dulu "Sisi Pasien") di homepage — Alur 2: materi
 * edukasi & pencegahan dari jurnal yang sama, dikirim lewat WhatsApp.
 * Server Component (mockup HP statis, tidak ada state).
 */

export function EdukasiKlinis() {
  return (
    <section id="edukasi-klinis" className="scroll-mt-20 bg-white py-24">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <span className="inline-block text-[#00e0af] font-bold tracking-widest text-xs uppercase">
              EDUKASI KLINIS
            </span>
            <h2 className="font-[family-name:var(--font-jakarta)] font-bold text-4xl md:text-6xl text-[#296eb7] leading-tight">
              Edukasi Pasien, Berbasis Evidensi yang Sama
            </h2>
            <p className="text-[#414751] text-lg max-w-xl leading-relaxed">
              Setelah konsultasi, agent menyusun materi edukasi dan langkah pencegahan
              berdasarkan jurnal medis yang sama, lalu mengirimkannya langsung melalui WhatsApp
              dalam bahasa yang mudah dipahami.
            </p>

            <div className="pt-6 border-t border-[#c1c7d2] space-y-2">
              <h3 className="font-[family-name:var(--font-jakarta)] font-bold text-lg text-[#121c28]">
                Tetap dalam Batas yang Aman
              </h3>
              <p className="text-sm text-[#414751] max-w-xl leading-relaxed">
                Pasien hanya menerima edukasi dan informasi kesehatan, bukan diagnosis atau
                keputusan klinis. Jika terdeteksi pertanyaan yang memerlukan penilaian medis,
                agent akan mengarahkan pasien untuk berkonsultasi kembali dengan tenaga
                kesehatan.
              </p>
            </div>
          </div>

          {/* Right: Mobile Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-0 bg-[#eef4ff] rounded-full blur-3xl opacity-40 scale-75 -z-10 translate-x-12"></div>
            <div className="w-[320px] h-[640px] bg-white rounded-[3rem] border-[12px] border-[#121c28] shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#121c28] rounded-b-2xl z-20"></div>
              <div className="bg-[#296eb7] text-white pt-10 pb-4 px-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">health_metrics</span>
                </div>
                <div>
                  <p className="text-xs font-bold">OneHealth Assistant</p>
                  <p className="text-[10px] opacity-70">Terverifikasi oleh Nakes</p>
                </div>
              </div>
              <div className="flex-grow bg-[#E5DDD5] p-4 space-y-4 overflow-y-auto">
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] text-[#121c28] p-3 rounded-lg rounded-tr-none text-sm shadow-sm max-w-[85%]">
                    Halo Dok, saya sering merasa nyeri punggung setelah kerja lama. Kenapa ya?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white text-[#121c28] p-3 rounded-lg rounded-tl-none text-sm shadow-sm max-w-[85%]">
                    <p className="mb-2">Berdasarkan pola aktivitas Anda, posisi duduk yang tidak ergonomis dapat meningkatkan ketegangan otot lumbar.</p>
                    <p className="mb-3">Cobalah peregangan setiap 30 menit. Tetap terhidrasi dan periksa posisi monitor Anda.</p>
                    <div className="inline-flex items-center gap-1 bg-[#e5eeff] text-[#296eb7] px-2 py-1 rounded-full text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[12px]">library_books</span>
                      SUMBER JURNAL
                    </div>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white text-[#414751] p-3 rounded-lg rounded-tl-none text-sm shadow-sm max-w-[85%] italic">
                    "Untuk diagnosis pasti dan penanganan medis lebih lanjut, silakan jadwalkan konsultasi dengan tim medis di klinik terdekat."
                  </div>
                </div>
              </div>
              <div className="bg-white p-3 flex items-center gap-2">
                <div className="flex-grow bg-[#d9e3f4] rounded-full h-10 px-4 flex items-center text-xs text-[#414751]">
                  Ketik pesan...
                </div>
                <div className="w-10 h-10 rounded-full bg-[#296eb7] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-sm">send</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
