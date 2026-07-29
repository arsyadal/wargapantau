import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/actions/auth";
import { getTickets } from "@/actions/tickets";
import { TicketCard } from "@/components/ticket-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    FileText,
    Plus,
    Clock,
    CheckCircle,
    AlertTriangle,
    Building
} from "lucide-react";

export default async function DashboardPage() {
    const user = await getUser();

    if (!user) {
        redirect("/login");
    }

    const isGovernment = user.role === "GOVERNMENT";

    // Get user's tickets or all tickets for government
    const myTicketsResult = await getTickets({ userId: isGovernment ? undefined : user.id });
    const myTickets = myTicketsResult.tickets || [];

    // Get tickets by status for quick stats
    const openTickets = myTickets.filter(t => t.status === "OPEN");
    const inProgressTickets = myTickets.filter(t => t.status === "IN_PROGRESS");
    const reviewingTickets = myTickets.filter(t => t.status === "REVIEWING");
    const closedTickets = myTickets.filter(t => t.status === "CLOSED");
    const disputedTickets = myTickets.filter(t => t.status === "DISPUTED");

    return (
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Selamat Datang, {user.name}!
                        </h1>
                        <p className="text-gray-500 flex items-center gap-2 mt-1">
                            {isGovernment ? (
                                <>
                                    <Building className="h-4 w-4" />
                                    {user.department || "Pemerintah"}
                                </>
                            ) : (
                                "Dashboard Warga"
                            )}
                        </p>
                    </div>
                    {!isGovernment && (
                        <Link href="/tickets/new">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Buat Laporan Baru
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4 text-center">
                            <Clock className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                            <div className="text-2xl font-bold text-blue-600">{openTickets.length}</div>
                            <div className="text-xs text-blue-600">Menunggu</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-100">
                        <CardContent className="p-4 text-center">
                            <FileText className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
                            <div className="text-2xl font-bold text-yellow-600">{inProgressTickets.length}</div>
                            <div className="text-xs text-yellow-600">Proses</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-100">
                        <CardContent className="p-4 text-center">
                            <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                            <div className="text-2xl font-bold text-purple-600">{reviewingTickets.length}</div>
                            <div className="text-xs text-purple-600">Ditinjau</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4 text-center">
                            <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
                            <div className="text-2xl font-bold text-green-600">{closedTickets.length}</div>
                            <div className="text-xs text-green-600">Selesai</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-100">
                        <CardContent className="p-4 text-center">
                            <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-red-600" />
                            <div className="text-2xl font-bold text-red-600">{disputedTickets.length}</div>
                            <div className="text-xs text-red-600">Sengketa</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for different ticket views */}
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="all">Semua ({myTickets.length})</TabsTrigger>
                        <TabsTrigger value="pending">Perlu Aksi</TabsTrigger>
                        <TabsTrigger value="completed">Selesai</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        {myTickets.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myTickets.map((ticket) => (
                                    <TicketCard key={ticket.id} ticket={ticket} />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500 mb-4">
                                        {isGovernment ? "Belum ada laporan" : "Anda belum membuat laporan"}
                                    </p>
                                    {!isGovernment && (
                                        <Link href="/tickets/new">
                                            <Button>Buat Laporan Pertama</Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="pending">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {isGovernment ? "Laporan yang Perlu Ditangani" : "Menunggu Verifikasi Anda"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isGovernment ? (
                                    [...openTickets, ...inProgressTickets].length > 0 ? (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[...openTickets, ...inProgressTickets].map((ticket) => (
                                                <TicketCard key={ticket.id} ticket={ticket} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">Tidak ada laporan yang perlu ditangani</p>
                                    )
                                ) : (
                                    reviewingTickets.length > 0 ? (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {reviewingTickets.map((ticket) => (
                                                <TicketCard key={ticket.id} ticket={ticket} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">Tidak ada laporan yang menunggu verifikasi Anda</p>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="completed">
                        {[...closedTickets, ...disputedTickets].length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...closedTickets, ...disputedTickets].map((ticket) => (
                                    <TicketCard key={ticket.id} ticket={ticket} />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-gray-500">Belum ada laporan yang selesai</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
