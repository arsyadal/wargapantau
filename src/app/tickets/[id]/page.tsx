import { notFound } from "next/navigation";
import { getTicketById } from "@/actions/tickets";
import { getUser } from "@/actions/auth";
import { StatusBadge } from "@/components/status-badge";
import { EvidenceGallery } from "@/components/evidence-gallery";
import { VerificationDialog } from "@/components/verification-dialog";
import { TicketMap } from "@/components/ticket-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import {
    MapPin,
    Calendar,
    User as UserIcon,
    History,
    Image as ImageIcon,
    MessageSquare,
    ArrowRight
} from "lucide-react";

interface TicketDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
    const { id } = await params;
    const { ticket, error } = await getTicketById(id);
    const user = await getUser();

    if (error || !ticket) {
        notFound();
    }

    const isOwner = user?.id === ticket.userId;
    const isGovernment = user?.role === "GOVERNMENT";
    const canVerify = isOwner && ticket.status === "REVIEWING";

    return (
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Ticket Header */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                            {ticket.title}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <UserIcon className="h-4 w-4" />
                                                {ticket.user.name}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDateTime(ticket.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={ticket.status} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                                {ticket.address && (
                                    <div className="flex items-start gap-2 mt-4 text-sm text-gray-500">
                                        <MapPin className="h-4 w-4 mt-0.5" />
                                        <span>{ticket.address}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tabs for Evidence, Verifications, History */}
                        <Tabs defaultValue="evidence" className="w-full">
                            <TabsList>
                                <TabsTrigger value="evidence" className="gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Bukti ({ticket.evidences.length})
                                </TabsTrigger>
                                <TabsTrigger value="verifications" className="gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Verifikasi ({ticket.verifications.length})
                                </TabsTrigger>
                                <TabsTrigger value="history" className="gap-2">
                                    <History className="h-4 w-4" />
                                    Riwayat
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="evidence">
                                <Card>
                                    <CardContent className="pt-6">
                                        <EvidenceGallery evidences={ticket.evidences} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="verifications">
                                <Card>
                                    <CardContent className="pt-6">
                                        {ticket.verifications.length > 0 ? (
                                            <div className="space-y-4">
                                                {ticket.verifications.map((verification) => (
                                                    <div
                                                        key={verification.id}
                                                        className={`p-4 rounded-lg border ${verification.isSatisfied
                                                                ? "bg-green-50 border-green-200"
                                                                : "bg-red-50 border-red-200"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">
                                                                    {verification.user.name}
                                                                </span>
                                                                {verification.isWitness && (
                                                                    <Badge variant="secondary">Saksi</Badge>
                                                                )}
                                                            </div>
                                                            <Badge variant={verification.isSatisfied ? "success" : "destructive"}>
                                                                {verification.isSatisfied ? "Puas" : "Tidak Puas"}
                                                            </Badge>
                                                        </div>
                                                        {!verification.isSatisfied && verification.reasonType && (
                                                            <p className="text-sm text-red-700 mb-2">
                                                                Alasan: {verification.reasonType.replace(/_/g, " ")}
                                                            </p>
                                                        )}
                                                        {verification.witnessComment && (
                                                            <p className="text-sm text-gray-600">
                                                                &ldquo;{verification.witnessComment}&rdquo;
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            {formatDateTime(verification.createdAt)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                <p>Belum ada verifikasi</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="history">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="relative">
                                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                                            <div className="space-y-6">
                                                {ticket.statusHistory.map((history) => (
                                                    <div key={history.id} className="relative pl-10">
                                                        <div className="absolute left-2.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge variant="outline">{history.previousStatus}</Badge>
                                                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                                                <StatusBadge status={history.newStatus} />
                                                            </div>
                                                            {history.reason && (
                                                                <p className="text-sm text-gray-600 mt-2">{history.reason}</p>
                                                            )}
                                                            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                                                                <span>Oleh: {history.changedBy.name}</span>
                                                                <span>{formatDateTime(history.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Map */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Lokasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TicketMap
                                    lat={ticket.lat}
                                    lng={ticket.lng}
                                    address={ticket.address || undefined}
                                    showWitnessRadius={true}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Radius 500m untuk saksi verifikasi
                                </p>
                            </CardContent>
                        </Card>

                        {/* Integrity Score */}
                        {ticket.integrityScore !== null && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Skor Integritas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center">
                                        <div className={`text-4xl font-bold ${ticket.integrityScore >= 70
                                                ? "text-green-600"
                                                : ticket.integrityScore >= 40
                                                    ? "text-yellow-600"
                                                    : "text-red-600"
                                            }`}>
                                            {ticket.integrityScore.toFixed(0)}%
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Berdasarkan {ticket.verifications.length} verifikasi
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Actions */}
                        {canVerify && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Aksi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <VerificationDialog
                                        ticketId={ticket.id}
                                        ticketTitle={ticket.title}
                                    />
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Verifikasi apakah masalah ini sudah benar-benar terselesaikan
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Government Actions */}
                        {isGovernment && ticket.status !== "CLOSED" && ticket.status !== "DISPUTED" && (
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-gray-500 text-center">
                                        {ticket.status === "REVIEWING"
                                            ? "Menunggu verifikasi dari pelapor"
                                            : "Gunakan fitur upload bukti untuk menandai selesai"}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
