import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { getUser } from "@/actions/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WargaPantau - Sistem Transparansi Pengaduan Publik",
  description: "Platform transparansi untuk pengaduan warga kepada pemerintah dengan sistem verifikasi dan integritas.",
  keywords: ["pengaduan", "transparansi", "pemerintah", "warga", "Indonesia"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <Header user={user} />
        <main>{children}</main>
        <footer className="border-t border-gray-200 bg-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>© 2026 WargaPantau. Platform transparansi pengaduan publik.</p>
            <p className="mt-1">Wujudkan pemerintahan yang bersih dan transparan bersama.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
