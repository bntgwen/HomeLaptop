import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import {
  Laptop,
  Search,
  ShoppingBag,
  Shield,
  ArrowRight,
  LogIn,
  UserPlus,
  Zap,
  CheckCircle2,
  Clock,
  QrCode,
  Wrench,
  Sparkles,
} from "lucide-react";

export default async function Home() {
  await connection();

  // Cek Status Login User
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? await verifyJWT(token) : null;
  const isLoggedIn = Boolean(user);

  // Query Prisma KHUSUS Kategori Laptop Bekas terbaru (hanya diambil jika user logged in)
  let newestLaptops: any[] = [];
  if (isLoggedIn) {
    try {
      newestLaptops = await prisma.catalog.findMany({
        where: {
          category: 'Laptop_Bekas',
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 4,
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          stock: true,
          description: true,
          image_url: true,
          image_urls: true,
        },
      });
    } catch {
      // Fallback jika database belum ready
    }
  }

  const formatRupiah = (val?: number | null) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val ?? 0);
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-background text-foreground">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Hero & Quick Action */}
        <div className="flex-1 flex flex-col gap-10 max-w-5xl p-6 py-12 sm:py-16 w-full text-center items-center">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
              <Laptop size={14} />
              <span>Sistem Servis & Penjualan Laptop Resmi</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Sistem Layanan Servis & Katalog Laptop
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Aplikasi terintegrasi untuk pelacakan tiket servis perangkat dan pembelian laptop bekas berkualitas serta suku cadang resmi.
            </p>
          </div>

          {/* Hero Action Buttons - Berbeda antara Guest vs Logged In */}
          <div className="w-full max-w-md mx-auto">
            {isLoggedIn ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <Link
                  href="/tracking"
                  className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Search size={16} />
                  <span>Lacak Servis</span>
                </Link>
                <Link
                  href="/catalogs"
                  className="w-full py-3 px-4 border border-border bg-card hover:bg-muted font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Laptop size={16} />
                  <span>Katalog</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                <Link
                  href="/tracking"
                  className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Search size={16} />
                  <span>Lacak Servis</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full py-3 px-4 border border-border bg-card hover:bg-muted font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="w-full py-3 px-4 border border-border bg-card hover:bg-muted font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  <span>Daftar</span>
                </Link>
              </div>
            )}
          </div>

          {/* KONTEN BERDASARKAN STATUS LOGIN */}
          {isLoggedIn ? (
            /* SECTION KHUSUS USER SUDAH LOGIN: KATALOG PRODUK */
            <div className="w-full pt-6 space-y-6 text-left">
              <div className="flex justify-between items-end border-b pb-3">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Pilihan Terbaik</span>
                  <h2 className="text-2xl font-extrabold tracking-tight mt-0.5">Laptop Bekas Terbaru</h2>
                  <p className="text-xs text-muted-foreground">Koleksi laptop second siap pakai, bergaransi, dan lolos uji teknis</p>
                </div>
                <Link
                  href="/catalogs"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {newestLaptops.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {newestLaptops.map((laptop) => {
                    const image = laptop.image_url || (laptop.image_urls && laptop.image_urls[0]) || null;
                    return (
                      <div
                        key={laptop.id}
                        className="border rounded-2xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div className="relative w-full h-48 overflow-hidden rounded-t-xl bg-neutral-900">
                          <Link href={`/catalogs/${laptop.id}`} className="block w-full h-full cursor-pointer">
                            {image ? (
                              <Image
                                src={image}
                                alt={laptop.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 25vw"
                                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                Foto belum tersedia
                              </div>
                            )}
                          </Link>
                          <span className="absolute top-3 right-3 z-10 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full">
                            Laptop Bekas
                          </span>
                        </div>

                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <Link href={`/catalogs/${laptop.id}`} className="hover:text-primary transition-colors">
                              <h3 className="font-bold text-sm line-clamp-1">{laptop.title}</h3>
                            </Link>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {laptop.description || 'Kondisi mulus bergaransi.'}
                            </p>
                          </div>

                          <div className="pt-2 border-t flex justify-between items-center mt-2">
                            <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                              {formatRupiah(laptop.price)}
                            </span>
                            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                              {laptop.stock > 0 ? `Stok: ${laptop.stock}` : 'Habis'}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <Link
                            href={`/catalogs/${laptop.id}`}
                            className="w-full py-1.5 px-3 border border-border text-center text-xs font-semibold rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Lihat Detail</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-2xl bg-card text-muted-foreground text-sm space-y-2">
                  <Laptop size={36} className="mx-auto text-muted-foreground/60" />
                  <p className="font-medium">Belum ada unit Laptop Bekas yang ditambahkan.</p>
                </div>
              )}
            </div>
          ) : (
            /* SECTION KHUSUS GUEST (BELUM LOGIN): DESKRIPSI & KEUNGGULAN FITUR */
            <div className="w-full pt-6 space-y-10 text-left">
              {/* Fitur Utama */}
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Keunggulan Layanan</span>
                  <h2 className="text-2xl font-extrabold tracking-tight mt-0.5">Solusi Terpadu Servis Laptop</h2>
                  <p className="text-xs text-muted-foreground">Kenapa mempercayakan perbaikan laptop dan gawai Anda di bengkel kami?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="p-5 border rounded-2xl bg-card space-y-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Zap size={20} />
                    </div>
                    <h3 className="font-bold text-base">Layanan Servis Cepat & Presisi</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Diagnosa mendalam oleh teknisi ahli menggunakan peralatan standar industri untuk penanganan hardware dan software.
                    </p>
                  </div>

                  <div className="p-5 border rounded-2xl bg-card space-y-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Search size={20} />
                    </div>
                    <h3 className="font-bold text-base">Transparansi Tracking Unit</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pantau proses pengerjaan unit mulai dari pengecekan, konfirmasi biaya, penggantian part, hingga unit selesai secara live.
                    </p>
                  </div>

                  <div className="p-5 border rounded-2xl bg-card space-y-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Shield size={20} />
                    </div>
                    <h3 className="font-bold text-base">Garansi Terjamin</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Setiap pergantian komponen dan servis bergaransi resmi untuk memastikan kepuasan dan kenyamanan operasional perangkat Anda.
                    </p>
                  </div>
                </div>
              </div>

              {/* Panduan Cara Melacak Servis untuk Guest */}
              <div className="p-6 sm:p-8 border border-border/80 rounded-2xl bg-gradient-to-br from-card to-muted/40 space-y-6">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Panduan Pelacakan</span>
                  <h3 className="text-xl font-bold mt-1">Cara Mudah Melacak Tiket Servis Anda</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pelanggan dapat memantau progres perbaikan kapan saja tanpa harus login ke sistem.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-xs">Terima Kode Tiket / Nota</h4>
                      <p className="text-[11px] text-muted-foreground">Saat menitipkan unit, Anda mendapatkan nomor tiket servis resmi.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-xs">Buka Menu Tracking</h4>
                      <p className="text-[11px] text-muted-foreground">Ketik kode tiket atau scan QR code yang tertera pada lembar nota.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-xs">Lihat Status & Estimasi</h4>
                      <p className="text-[11px] text-muted-foreground">Dapatkan rincian status pengerjaan, estimasi biaya, dan nota digital.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <Link
                    href="/tracking"
                    className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Search size={14} />
                    <span>Lacak Servis</span>
                  </Link>
                  <Link
                    href="/auth/login"
                    className="w-full py-2.5 px-4 border border-border bg-card text-xs font-semibold rounded-xl hover:bg-muted transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn size={14} />
                    <span>Login Akun</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4 text-left">
            <div className="border rounded-2xl p-5 bg-card/60 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Search size={20} />
              </div>
              <h3 className="font-bold text-sm">Pelacakan Real-Time</h3>
              <p className="text-xs text-muted-foreground">
                Cek riwayat tahapan pengecekan hingga siap diambil menggunakan nomor tiket atau QR code.
              </p>
            </div>
            <div className="border rounded-2xl p-5 bg-card/60 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <h3 className="font-bold text-sm">Katalog Produk</h3>
              <p className="text-xs text-muted-foreground">
                Pilihan laptop bekas bergaransi, suku cadang asli, dan aksesoris berkualitas untuk member.
              </p>
            </div>
            <div className="border rounded-2xl p-5 bg-card/60 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Shield size={20} />
              </div>
              <h3 className="font-bold text-sm">Dashboard Terpusat</h3>
              <p className="text-xs text-muted-foreground">
                Akses khusus Admin dan Teknisi untuk memproses tiket servis dan manajemen katalog.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t border-border/40 mx-auto text-center text-xs py-8 text-muted-foreground">
          <p>© 2026 UKK Servis Laptop. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
