"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTicket } from "@/actions/tickets";
import { MapPin, FileText, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

// Dynamic import for map to avoid SSR issues
const MapPicker = dynamic(() => import("./map-picker").then((mod) => mod.MapPicker), {
    ssr: false,
    loading: () => (
        <div className="space-y-3">
            <div className="h-10 w-full rounded-md bg-gray-100 animate-pulse" />
            <div className="h-[300px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Memuat peta...</p>
            </div>
        </div>
    ),
});

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled} className="w-full">
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengirim...
                </>
            ) : (
                "Kirim Laporan"
            )}
        </Button>
    );
}

interface ImagePreview {
    id: string;
    file: File;
    preview: string;
}

export function TicketForm() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");

    const handleLocationSelect = (lat: number, lng: number, selectedAddress?: string) => {
        setLocation({ lat, lng });
        if (selectedAddress) {
            setAddress(selectedAddress);
        }
    };

    const handleAddressChange = (newAddress: string) => {
        setAddress(newAddress);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: ImagePreview[] = [];

        Array.from(files).forEach((file) => {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                setError("Hanya file gambar yang diperbolehkan");
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("Ukuran gambar maksimal 5MB");
                return;
            }

            const preview = URL.createObjectURL(file);
            newImages.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                preview,
            });
        });

        setImages((prev) => [...prev, ...newImages].slice(0, 5)); // Max 5 images
        setError("");

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeImage = (id: string) => {
        setImages((prev) => {
            const image = prev.find((img) => img.id === id);
            if (image) {
                URL.revokeObjectURL(image.preview);
            }
            return prev.filter((img) => img.id !== id);
        });
    };

    // Upload images using API route
    const uploadImages = async (ticketId: string): Promise<boolean> => {
        let allSuccess = true;

        for (let i = 0; i < images.length; i++) {
            setUploadProgress(`Mengupload gambar ${i + 1} dari ${images.length}...`);

            const formData = new FormData();
            formData.append("ticketId", ticketId);
            formData.append("file", images[i].file);

            try {
                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                const result = await response.json();

                if (!response.ok) {
                    console.error(`Upload failed for image ${i}:`, result.error);
                    allSuccess = false;
                } else {
                    console.log(`Image ${i} uploaded:`, result.url);
                }
            } catch (error) {
                console.error(`Upload error for image ${i}:`, error);
                allSuccess = false;
            }
        }

        setUploadProgress("");
        return allSuccess;
    };

    const handleSubmit = async (formData: FormData) => {
        if (!location) {
            setError("Silakan pilih lokasi pada peta atau cari alamat");
            return;
        }

        setIsUploading(true);
        setError("");

        try {
            formData.set("lat", String(location.lat));
            formData.set("lng", String(location.lng));
            formData.set("address", address);

            // Create ticket first (without images)
            const result = await createTicket(formData);

            if (result.error) {
                setError(result.error);
                setIsUploading(false);
                return;
            }

            if (!result.ticketId) {
                setError("Gagal membuat laporan");
                setIsUploading(false);
                return;
            }

            // Upload images if any
            if (images.length > 0) {
                await uploadImages(result.ticketId);
            }

            // Clean up image previews
            images.forEach((img) => URL.revokeObjectURL(img.preview));

            // Redirect to ticket detail
            router.push(`/tickets/${result.ticketId}`);
        } catch (err) {
            console.error("Submit error:", err);
            setError("Terjadi kesalahan. Silakan coba lagi.");
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Buat Laporan Baru
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul Laporan</Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="Contoh: Jalan berlubang di Jl. Sudirman"
                            required
                            minLength={5}
                            maxLength={100}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi Masalah</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Jelaskan masalah secara detail: apa yang terjadi, kapan, dan dampaknya..."
                            required
                            minLength={20}
                            maxLength={1000}
                            rows={4}
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Foto Bukti (Opsional)
                        </Label>
                        <p className="text-xs text-gray-500 mb-2">
                            Upload foto sebagai bukti masalah. Maksimal 5 foto, ukuran per foto maks 5MB.
                        </p>

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                {images.map((image) => (
                                    <div key={image.id} className="relative group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={image.preview}
                                            alt="Preview"
                                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(image.id)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                            {image.file.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        {images.length < 5 && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                            >
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                    Klik untuk upload foto
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    JPG, PNG, atau GIF (maks 5MB)
                                </p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Map Location Section */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Lokasi Masalah
                        </Label>
                        <MapPicker
                            onLocationSelect={handleLocationSelect}
                            address={address}
                            onAddressChange={handleAddressChange}
                        />
                        {location && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-700 font-medium">
                                    ✓ Lokasi dipilih
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    Koordinat: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                </p>
                                {address && (
                                    <p className="text-xs text-green-600 mt-1 line-clamp-2">
                                        Alamat: {address}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hidden input for address */}
                    <input type="hidden" name="address" value={address} />

                    {/* Upload Progress */}
                    {uploadProgress && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {uploadProgress}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    <SubmitButton disabled={isUploading} />
                </form>
            </CardContent>
        </Card>
    );
}
