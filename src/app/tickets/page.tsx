import Link from "next/link";
import { getTickets } from "@/actions/tickets";
import { TicketCard } from "@/components/ticket-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Filter } from "lucide-react";
import { TicketStatus } from "@prisma/client";

interface TicketsPageProps {
    searchParams: Promise<{
        status?: string;
        page?: string;
    }>;
}

const statusFilters = [
    { value: "", label: "Semua" },
    { value: "OPEN", label: "Menunggu" },
    { value: "IN_PROGRESS", label: "Proses" },
    { value: "REVIEWING", label: "Ditinjau" },
    { value: "CLOSED", label: "Selesai" },
    { value: "DISPUTED", label: "Sengketa" },
];

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
    const params = await searchParams;
    const statusFilter = params.status as TicketStatus | undefined;

    const { tickets, error } = await getTickets({
        status: statusFilter || undefined,
        limit: 20,
    });

    return (
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Semua Laporan</h1>
                        <p className="text-gray-500">Lihat dan pantau semua laporan warga</p>
                    </div>
                    <Link href="/tickets/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Buat Laporan
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500 mr-2">Filter:</span>
                        {statusFilters.map((filter) => (
                            <Link
                                key={filter.value}
                                href={filter.value ? `/tickets?status=${filter.value}` : "/tickets"}
                            >
                                <Badge
                                    variant={statusFilter === filter.value || (!statusFilter && !filter.value) ? "default" : "outline"}
                                    className="cursor-pointer"
                                >
                                    {filter.label}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <Card className="mb-6 border-red-200 bg-red-50">
                        <CardContent className="p-4 text-red-800">
                            {error}
                        </CardContent>
                    </Card>
                )}

                {/* Tickets Grid */}
                {tickets && tickets.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tickets.map((ticket) => (
                            <TicketCard key={ticket.id} ticket={ticket} />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {statusFilter ? "Tidak ada laporan dengan status ini" : "Belum ada laporan"}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {statusFilter
                                    ? "Coba filter dengan status lain"
                                    : "Jadilah yang pertama melaporkan masalah di sekitar Anda"}
                            </p>
                            {statusFilter ? (
                                <Link href="/tickets">
                                    <Button variant="outline">Lihat Semua Laporan</Button>
                                </Link>
                            ) : (
                                <Link href="/tickets/new">
                                    <Button>Buat Laporan Pertama</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
