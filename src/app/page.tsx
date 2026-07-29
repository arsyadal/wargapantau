import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TicketCard } from "@/components/ticket-card";
import { getTickets } from "@/actions/tickets";
import { prisma } from "@/lib/prisma";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  FileText,
  MapPin,
  Shield,
  Users
} from "lucide-react";

export default async function Home() {
  const { tickets } = await getTickets({ limit: 6 });

  // Get basic stats
  let stats = { total: 0, closed: 0, disputed: 0, integrityRate: 0 };
  try {
    const totalTickets = await prisma.ticket.count();
    const closedTickets = await prisma.ticket.count({ where: { status: "CLOSED" } });
    const disputedTickets = await prisma.ticket.count({ where: { status: "DISPUTED" } });
    const integrityRate = (closedTickets + disputedTickets) > 0
      ? Math.round((closedTickets / (closedTickets + disputedTickets)) * 100)
      : 100;

    stats = {
      total: totalTickets,
      closed: closedTickets,
      disputed: disputedTickets,
      integrityRate,
    };
  } catch {
    // Database might not be connected yet
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Wujudkan Transparansi Pemerintahan
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Platform pengaduan warga dengan sistem verifikasi.
              Laporkan masalah, pantau penyelesaian, dan verifikasi hasilnya.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/tickets/new">
                <Button size="lg" variant="secondary" className="gap-2">
                  <FileText className="h-5 w-5" />
                  Buat Laporan
                </Button>
              </Link>
              <Link href="/statistics">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent border-white text-white hover:bg-white/10">
                  <BarChart3 className="h-5 w-5" />
                  Lihat Statistik
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Laporan</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-3xl font-bold text-gray-900">{stats.closed}</div>
                <div className="text-sm text-gray-500">Selesai</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <Shield className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-3xl font-bold text-gray-900">{stats.disputed}</div>
                <div className="text-sm text-gray-500">Disengketakan</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-3xl font-bold text-gray-900">{stats.integrityRate}%</div>
                <div className="text-sm text-gray-500">Tingkat Integritas</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Bagaimana Cara Kerjanya?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Laporkan</h3>
              <p className="text-gray-600">
                Buat laporan dengan lokasi peta, deskripsi detail, dan bukti foto
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Proses</h3>
              <p className="text-gray-600">
                Pemerintah memproses laporan dan mengunggah bukti penyelesaian
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Verifikasi</h3>
              <p className="text-gray-600">
                Warga memverifikasi hasil. Jika bohong, laporkan dengan bukti tandingan!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Tickets Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Laporan Terbaru
            </h2>
            <Link href="/tickets">
              <Button variant="outline" className="gap-2">
                Lihat Semua
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {tickets && tickets.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">Belum ada laporan</p>
              <Link href="/tickets/new">
                <Button>Buat Laporan Pertama</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
