"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadEvidence(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Anda harus login untuk mengunggah bukti" };
    }

    const ticketId = formData.get("ticketId") as string;
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;

    if (!ticketId || !file) {
        return { error: "Data tidak lengkap" };
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser) {
            return { error: "User tidak ditemukan" };
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            return { error: "Laporan tidak ditemukan" };
        }

        // Upload file to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${ticketId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(fileName, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { error: "Gagal mengunggah file" };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("evidence")
            .getPublicUrl(fileName);

        // Create evidence record
        await prisma.evidence.create({
            data: {
                ticketId,
                imageUrl: urlData.publicUrl,
                description,
                uploaderRole: dbUser.role,
                uploaderId: dbUser.id,
            },
        });

        revalidatePath(`/tickets/${ticketId}`);

        return { success: true, url: urlData.publicUrl };
    } catch (error) {
        console.error("Error uploading evidence:", error);
        return { error: "Gagal mengunggah bukti. Silakan coba lagi." };
    }
}

export async function uploadCounterEvidence(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Anda harus login untuk mengunggah bukti tandingan" };
    }

    const ticketId = formData.get("ticketId") as string;
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;

    if (!ticketId || !file) {
        return { error: "Data tidak lengkap" };
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser) {
            return { error: "User tidak ditemukan" };
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            return { error: "Laporan tidak ditemukan" };
        }

        // Only ticket owner can upload counter evidence
        if (ticket.userId !== dbUser.id) {
            return { error: "Hanya pelapor yang dapat mengunggah bukti tandingan" };
        }

        // Only allow counter evidence for disputed or reviewing status
        if (ticket.status !== "DISPUTED" && ticket.status !== "REVIEWING") {
            return { error: "Bukti tandingan hanya dapat diunggah saat status disputed atau reviewing" };
        }

        // Upload file to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${ticketId}/counter-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(fileName, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { error: "Gagal mengunggah file" };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("evidence")
            .getPublicUrl(fileName);

        // Create evidence record
        await prisma.evidence.create({
            data: {
                ticketId,
                imageUrl: urlData.publicUrl,
                description: description || "Bukti tandingan dari pelapor",
                uploaderRole: dbUser.role,
                uploaderId: dbUser.id,
            },
        });

        revalidatePath(`/tickets/${ticketId}`);

        return { success: true, url: urlData.publicUrl };
    } catch (error) {
        console.error("Error uploading counter evidence:", error);
        return { error: "Gagal mengunggah bukti tandingan. Silakan coba lagi." };
    }
}
