"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReasonType } from "@prisma/client";

const verifyTicketSchema = z.object({
    ticketId: z.string(),
    isSatisfied: z.boolean(),
    reasonType: z.nativeEnum(ReasonType).optional(),
    witnessComment: z.string().max(500).optional(),
});

const witnessVerificationSchema = z.object({
    ticketId: z.string(),
    isSatisfied: z.boolean(),
    witnessComment: z.string().min(10, "Komentar minimal 10 karakter").max(500),
    userLat: z.number(),
    userLng: z.number(),
});

export async function verifyTicket(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Anda harus login untuk memverifikasi" };
    }

    const rawData = {
        ticketId: formData.get("ticketId") as string,
        isSatisfied: formData.get("isSatisfied") === "true",
        reasonType: (formData.get("reasonType") as ReasonType) || undefined,
        witnessComment: (formData.get("witnessComment") as string) || undefined,
    };

    const result = verifyTicketSchema.safeParse(rawData);
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser) {
            return { error: "User tidak ditemukan" };
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: result.data.ticketId },
            include: { user: true },
        });

        if (!ticket) {
            return { error: "Laporan tidak ditemukan" };
        }

        // Only the ticket owner can verify (non-witness verification)
        if (ticket.userId !== dbUser.id) {
            return { error: "Hanya pelapor yang dapat memverifikasi" };
        }

        if (ticket.status !== "REVIEWING") {
            return { error: "Laporan belum dalam status ditinjau" };
        }

        // Create verification
        await prisma.verification.create({
            data: {
                ticketId: result.data.ticketId,
                userId: dbUser.id,
                isSatisfied: result.data.isSatisfied,
                reasonType: result.data.isSatisfied ? null : result.data.reasonType,
                witnessComment: result.data.witnessComment,
                isWitness: false,
            },
        });

        // Update ticket status based on verification
        const newStatus = result.data.isSatisfied ? "CLOSED" : "DISPUTED";
        await prisma.ticket.update({
            where: { id: result.data.ticketId },
            data: { status: newStatus },
        });

        // Log status change
        await prisma.statusHistory.create({
            data: {
                ticketId: result.data.ticketId,
                previousStatus: ticket.status,
                newStatus: newStatus,
                changedById: dbUser.id,
                reason: result.data.isSatisfied
                    ? "Pelapor memverifikasi penyelesaian"
                    : `Pelapor menolak: ${result.data.reasonType}`,
            },
        });

        revalidatePath(`/tickets/${result.data.ticketId}`);
        revalidatePath("/tickets");
        revalidatePath("/dashboard");
        revalidatePath("/statistics");

        return { success: true, disputed: !result.data.isSatisfied };
    } catch (error) {
        console.error("Error verifying ticket:", error);
        return { error: "Gagal memverifikasi. Silakan coba lagi." };
    }
}

export async function addWitnessVerification(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Anda harus login untuk menjadi saksi" };
    }

    const rawData = {
        ticketId: formData.get("ticketId") as string,
        isSatisfied: formData.get("isSatisfied") === "true",
        witnessComment: formData.get("witnessComment") as string,
        userLat: parseFloat(formData.get("userLat") as string),
        userLng: parseFloat(formData.get("userLng") as string),
    };

    const result = witnessVerificationSchema.safeParse(rawData);
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser) {
            return { error: "User tidak ditemukan" };
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: result.data.ticketId },
        });

        if (!ticket) {
            return { error: "Laporan tidak ditemukan" };
        }

        // Check if user is within 500m radius
        const distance = calculateDistance(
            result.data.userLat,
            result.data.userLng,
            ticket.lat,
            ticket.lng
        );

        if (distance > 500) {
            return { error: "Anda harus berada dalam radius 500m dari lokasi laporan" };
        }

        // Check if user already verified
        const existingVerification = await prisma.verification.findUnique({
            where: {
                ticketId_userId: {
                    ticketId: result.data.ticketId,
                    userId: dbUser.id,
                },
            },
        });

        if (existingVerification) {
            return { error: "Anda sudah memberikan verifikasi" };
        }

        // Create witness verification
        await prisma.verification.create({
            data: {
                ticketId: result.data.ticketId,
                userId: dbUser.id,
                isSatisfied: result.data.isSatisfied,
                witnessComment: result.data.witnessComment,
                isWitness: true,
            },
        });

        // Recalculate integrity score
        await updateIntegrityScore(result.data.ticketId);

        revalidatePath(`/tickets/${result.data.ticketId}`);

        return { success: true };
    } catch (error) {
        console.error("Error adding witness verification:", error);
        return { error: "Gagal menambah verifikasi saksi. Silakan coba lagi." };
    }
}

// Helper function to calculate distance using Haversine formula
function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Update integrity score based on verifications
async function updateIntegrityScore(ticketId: string) {
    const verifications = await prisma.verification.findMany({
        where: { ticketId },
    });

    if (verifications.length === 0) {
        return;
    }

    const satisfiedCount = verifications.filter((v) => v.isSatisfied).length;
    const integrityScore = (satisfiedCount / verifications.length) * 100;

    await prisma.ticket.update({
        where: { id: ticketId },
        data: { integrityScore },
    });
}
