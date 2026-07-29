import Link from "next/link";
import { Ticket, User } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { MapPin, Calendar, MessageSquare, Image as ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TicketCardProps {
    ticket: Ticket & {
        user: Pick<User, "name" | "email">;
        _count: {
            evidences: number;
            verifications: number;
        };
    };
}

export function TicketCard({ ticket }: TicketCardProps) {
    return (
        <Link href={`/tickets/${ticket.id}`}>
            <Card className="h-full transition-all hover:shadow-md hover:border-blue-200 cursor-pointer">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                            {ticket.title}
                        </h3>
                        <StatusBadge status={ticket.status} />
                    </div>
                </CardHeader>
                <CardContent className="pb-3">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {ticket.description}
                    </p>
                    {ticket.address && (
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{ticket.address}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {ticket._count.evidences} Bukti
                        </div>
                        <div className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {ticket._count.verifications} Verifikasi
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between w-full text-xs text-gray-500">
                        <span>Oleh: {ticket.user.name}</span>
                        <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(ticket.createdAt)}
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
