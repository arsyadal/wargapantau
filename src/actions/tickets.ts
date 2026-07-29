"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TicketStatus } from "@prisma/client";

const createTicketSchema = z.object({
    title: z.string().min(5, "Judul minimal 5 karakter").max(100),
    description: z.string().min(20, "Deskripsi minimal 20 karakter").max(1000),
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
});

const updateStatusSchema = z.object({
    ticketId: z.string(),
    status: z.nativeEnum(TicketStatus),
    reason: z.string().optional(),
});

export async function createTicket(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Anda harus login untuk membuat laporan" };
    }

    const rawData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        lat: parseFloat(formData.get("lat") as string),
        lng: parseFloat(formData.get("lng") as string),
        address: (formData.get("address") as string) || undefined,
    };

    const result = createTicketSchema.safeParse(rawData);
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    try {
        // Ensure user exists in database
        let dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email!,
                    name: user.user_metadata?.name || user.email?.split("@")[0],
                    role: "USER",
                },
            });
        }

        const ticket = await prisma.ticket.create({
            data: {
                title: result.data.title,
                description: result.data.description,
                lat: result.data.lat,
                lng: result.data.lng,
                address: result.data.address,
                userId: dbUser.id,
                status: "OPEN",
            },
        });

        // Create initial status history
        await prisma.statusHistory.create({
            data: {
                ticketId: ticket.id,
                previousStatus: "OPEN",
                newStatus: "OPEN",
                changedById: dbUser.id,
                reason: "Laporan baru dibuat",
            },
        });

        // Handle image uploads
        const imageCount = parseInt(formData.get("imageCount") as string) || 0;
        console.log(`[createTicket] Uploading ${imageCount} images for ticket ${ticket.id}`);

        for (let i = 0; i < imageCount; i++) {
            const file = formData.get(`image_${i}`) as File;
            if (!file || !(file instanceof File)) continue;

            try {
                const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
                const fileName = `${ticket.id}/${Date.now()}-${i}.${fileExt}`;

                // Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from("evidence")
                    .upload(fileName, file, {
                        contentType: file.type,
                        cacheControl: "3600",
                    });

                if (uploadError) {
                    console.error(`[createTicket] Upload error for image ${i}:`, uploadError);
                    continue; // Skip this image but continue with others
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from("evidence")
                    .getPublicUrl(fileName);

                // Create evidence record
                await prisma.evidence.create({
                    data: {
                        ticketId: ticket.id,
                        imageUrl: urlData.publicUrl,
                        description: `Bukti foto dari pelapor`,
                        uploaderRole: dbUser.role,
                        uploaderId: dbUser.id,
                    },
                });

                console.log(`[createTicket] Image ${i} uploaded successfully: ${urlData.publicUrl}`);
            } catch (imgError) {
                console.error(`[createTicket] Error uploading image ${i}:`, imgError);
                // Continue with other images
            }
        }

        revalidatePath("/tickets");
        revalidatePath("/dashboard");

        return { success: true, ticketId: ticket.id };
    } catch (error) {
        console.error("Error creating ticket:", error);
        return { error: "Gagal membuat laporan. Silakan coba lagi." };
    }
}

export async function updateTicketStatus(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Anda harus login" };
    }

    const rawData = {
        ticketId: formData.get("ticketId") as string,
        status: formData.get("status") as TicketStatus,
        reason: (formData.get("reason") as string) || undefined,
    };

    const result = updateStatusSchema.safeParse(rawData);
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser || dbUser.role !== "GOVERNMENT") {
            return { error: "Hanya pemerintah yang dapat mengubah status" };
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: result.data.ticketId },
        });

        if (!ticket) {
            return { error: "Laporan tidak ditemukan" };
        }

        // Update ticket status
        await prisma.ticket.update({
            where: { id: result.data.ticketId },
            data: { status: result.data.status },
        });

        // Log status change
        await prisma.statusHistory.create({
            data: {
                ticketId: result.data.ticketId,
                previousStatus: ticket.status,
                newStatus: result.data.status,
                changedById: dbUser.id,
                reason: result.data.reason,
            },
        });

        revalidatePath(`/tickets/${result.data.ticketId}`);
        revalidatePath("/tickets");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Error updating ticket status:", error);
        return { error: "Gagal mengubah status. Silakan coba lagi." };
    }
}

export async function claimCompleted(ticketId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Anda harus login" };
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser || dbUser.role !== "GOVERNMENT") {
            return { error: "Hanya pemerintah yang dapat mengklaim selesai" };
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            return { error: "Laporan tidak ditemukan" };
        }

        // Update to REVIEWING status (waiting for citizen verification)
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: "REVIEWING" },
        });

        // Log status change
        await prisma.statusHistory.create({
            data: {
                ticketId: ticketId,
                previousStatus: ticket.status,
                newStatus: "REVIEWING",
                changedById: dbUser.id,
                reason: "Pemerintah mengklaim telah menyelesaikan masalah",
            },
        });

        revalidatePath(`/tickets/${ticketId}`);
        revalidatePath("/tickets");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Error claiming completion:", error);
        return { error: "Gagal mengklaim selesai. Silakan coba lagi." };
    }
}

export async function getTickets(options?: {
    status?: TicketStatus;
    userId?: string;
    limit?: number;
    offset?: number;
}) {
    try {
        const where: Record<string, unknown> = {};
        if (options?.status) where.status = options.status;
        if (options?.userId) where.userId = options.userId;

        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                _count: {
                    select: {
                        evidences: true,
                        verifications: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: options?.limit || 20,
            skip: options?.offset || 0,
        });

        return { tickets };
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return { error: "Gagal memuat laporan", tickets: [] };
    }
}

export async function getTicketById(ticketId: string) {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                evidences: {
                    include: {
                        uploader: { select: { name: true, role: true } },
                    },
                    orderBy: { createdAt: "desc" },
                },
                verifications: {
                    include: {
                        user: { select: { name: true } },
                    },
                    orderBy: { createdAt: "desc" },
                },
                statusHistory: {
                    include: {
                        changedBy: { select: { name: true, role: true } },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!ticket) {
            return { error: "Laporan tidak ditemukan" };
        }

        return { ticket };
    } catch (error) {
        console.error("Error fetching ticket:", error);
        return { error: "Gagal memuat laporan" };
    }
}
