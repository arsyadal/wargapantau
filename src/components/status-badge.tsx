import { TicketStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
    status: TicketStatus;
}

const statusConfig = {
    OPEN: { label: "Menunggu", variant: "open" as const },
    IN_PROGRESS: { label: "Dalam Proses", variant: "in_progress" as const },
    REVIEWING: { label: "Ditinjau", variant: "reviewing" as const },
    CLOSED: { label: "Selesai", variant: "closed" as const },
    DISPUTED: { label: "Disengketakan", variant: "disputed" as const },
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
}
