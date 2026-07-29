import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const ticketId = formData.get("ticketId") as string;
        const file = formData.get("file") as File;

        if (!ticketId || !file) {
            return NextResponse.json({ error: "Missing ticketId or file" }, { status: 400 });
        }

        console.log(`[Upload API] Uploading file for ticket ${ticketId}, file: ${file.name}, size: ${file.size}`);

        // Get user from database
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify ticket exists
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${ticketId}/${Date.now()}.${fileExt}`;

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: "3600",
            });

        if (uploadError) {
            console.error("[Upload API] Storage upload error:", uploadError);
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("evidence")
            .getPublicUrl(fileName);

        // Create evidence record
        const evidence = await prisma.evidence.create({
            data: {
                ticketId,
                imageUrl: urlData.publicUrl,
                description: "Bukti foto dari pelapor",
                uploaderRole: dbUser.role,
                uploaderId: dbUser.id,
            },
        });

        console.log(`[Upload API] Evidence created: ${evidence.id}, URL: ${urlData.publicUrl}`);

        return NextResponse.json({
            success: true,
            evidenceId: evidence.id,
            url: urlData.publicUrl,
        });
    } catch (error) {
        console.error("[Upload API] Error:", error);
        return NextResponse.json(
            { error: `Server error: ${error instanceof Error ? error.message : "Unknown"}` },
            { status: 500 }
        );
    }
}
