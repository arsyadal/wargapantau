"use client";

import dynamic from "next/dynamic";

interface TicketMapProps {
    lat: number;
    lng: number;
    address?: string;
    showWitnessRadius?: boolean;
}

const MapViewInner = dynamic(
    () => import("@/components/map-view").then((mod) => mod.MapView),
    {
        ssr: false,
        loading: () => (
            <div className="h-[250px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Memuat peta...</p>
            </div>
        ),
    }
);

export function TicketMap({ lat, lng, address, showWitnessRadius }: TicketMapProps) {
    return (
        <MapViewInner
            lat={lat}
            lng={lng}
            address={address}
            showWitnessRadius={showWitnessRadius}
        />
    );
}
