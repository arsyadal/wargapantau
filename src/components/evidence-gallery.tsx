"use client";

import { Evidence, Role } from "@prisma/client";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface EvidenceGalleryProps {
    evidences: (Evidence & {
        uploader: {
            name: string | null;
            role: Role;
        };
    })[];
}

export function EvidenceGallery({ evidences }: EvidenceGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (evidences.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <p>Belum ada bukti yang diunggah</p>
            </div>
        );
    }

    const citizenEvidences = evidences.filter((e) => e.uploaderRole === "USER");
    const governmentEvidences = evidences.filter((e) => e.uploaderRole === "GOVERNMENT");

    return (
        <>
            <div className="space-y-6">
                {citizenEvidences.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Badge variant="secondary">Warga</Badge>
                            Bukti dari Pelapor
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {citizenEvidences.map((evidence) => (
                                <div
                                    key={evidence.id}
                                    className="relative group cursor-pointer"
                                    onClick={() => setSelectedImage(evidence.imageUrl)}
                                >
                                    <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                                        <Image
                                            src={evidence.imageUrl}
                                            alt={evidence.description || "Bukti"}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {formatDateTime(evidence.createdAt)}
                                    </div>
                                    {evidence.description && (
                                        <p className="text-xs text-gray-600 truncate">{evidence.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {governmentEvidences.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Badge variant="default">Pemerintah</Badge>
                            Bukti Penyelesaian
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {governmentEvidences.map((evidence) => (
                                <div
                                    key={evidence.id}
                                    className="relative group cursor-pointer"
                                    onClick={() => setSelectedImage(evidence.imageUrl)}
                                >
                                    <div className="aspect-square relative rounded-lg overflow-hidden border border-blue-200">
                                        <Image
                                            src={evidence.imageUrl}
                                            alt={evidence.description || "Bukti"}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {formatDateTime(evidence.createdAt)}
                                    </div>
                                    {evidence.description && (
                                        <p className="text-xs text-gray-600 truncate">{evidence.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogTitle className="sr-only">Pratinjau Bukti</DialogTitle>
                    {selectedImage && (
                        <div className="relative aspect-video">
                            <Image
                                src={selectedImage}
                                alt="Pratinjau bukti"
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
