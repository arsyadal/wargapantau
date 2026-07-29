"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@prisma/client";

const signUpSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    name: z.string().min(2, "Nama minimal 2 karakter"),
    role: z.nativeEnum(Role),
    department: z.string().optional(),
});

const signInSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(1, "Password tidak boleh kosong"),
});

export async function signUp(formData: FormData) {
    try {
        const supabase = await createClient();

        const rawData = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            name: formData.get("name") as string,
            role: (formData.get("role") as Role) || "USER",
            department: (formData.get("department") as string) || undefined,
        };

        // Validate input
        const result = signUpSchema.safeParse(rawData);
        if (!result.success) {
            const errorMessages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
            console.error("[SignUp] Validation error:", errorMessages);
            return { error: result.error.issues[0].message };
        }

        console.log("[SignUp] Attempting to create user:", result.data.email);

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: result.data.email,
            password: result.data.password,
            options: {
                data: {
                    name: result.data.name,
                    role: result.data.role,
                },
            },
        });

        if (authError) {
            console.error("[SignUp] Supabase auth error:", authError.message, authError.code);

            // Translate common Supabase errors to Indonesian
            const errorMap: Record<string, string> = {
                "User already registered": "Email sudah terdaftar",
                "Password should be at least 6 characters": "Password minimal 6 karakter",
                "Unable to validate email address: invalid format": "Format email tidak valid",
                "Email address is invalid": "Alamat email tidak valid. Gunakan email yang valid.",
                "Signup requires a valid password": "Password tidak boleh kosong",
            };

            return { error: errorMap[authError.message] || `Error: ${authError.message}` };
        }

        if (!authData.user) {
            console.error("[SignUp] No user returned from Supabase");
            return { error: "Gagal membuat akun. Silakan coba lagi." };
        }

        console.log("[SignUp] Auth user created:", authData.user.id);

        // Create user in database
        try {
            await prisma.user.create({
                data: {
                    id: authData.user.id,
                    email: result.data.email,
                    name: result.data.name,
                    role: result.data.role,
                    department: result.data.department,
                },
            });
            console.log("[SignUp] Database user created successfully");
        } catch (dbError) {
            console.error("[SignUp] Database error:", dbError);
            // Continue anyway - user might already exist or will be created on next login
        }

        revalidatePath("/", "layout");
        redirect("/dashboard");
    } catch (error) {
        console.error("[SignUp] Unexpected error:", error);

        // Check if this is a redirect (Next.js throws redirect as an error)
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            throw error;
        }

        return { error: `Terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
}

export async function signIn(formData: FormData) {
    try {
        const supabase = await createClient();

        const rawData = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        };

        // Validate input
        const result = signInSchema.safeParse(rawData);
        if (!result.success) {
            console.error("[SignIn] Validation error:", result.error.issues);
            return { error: result.error.issues[0].message };
        }

        console.log("[SignIn] Attempting login for:", result.data.email);

        const { error } = await supabase.auth.signInWithPassword({
            email: result.data.email,
            password: result.data.password,
        });

        if (error) {
            console.error("[SignIn] Auth error:", error.message, error.code);

            // Translate common errors
            const errorMap: Record<string, string> = {
                "Invalid login credentials": "Email atau password salah",
                "Email not confirmed": "Email belum dikonfirmasi. Cek inbox Anda.",
                "Too many requests": "Terlalu banyak percobaan. Tunggu beberapa menit.",
            };

            return { error: errorMap[error.message] || `Error: ${error.message}` };
        }

        console.log("[SignIn] Login successful");
        revalidatePath("/", "layout");
        redirect("/dashboard");
    } catch (error) {
        console.error("[SignIn] Unexpected error:", error);

        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            throw error;
        }

        return { error: `Terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
}

export async function signOut() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
        console.log("[SignOut] User signed out");
        revalidatePath("/", "layout");
        redirect("/login");
    } catch (error) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            throw error;
        }
        console.error("[SignOut] Error:", error);
        redirect("/login");
    }
}

export async function getUser() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return null;
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        // If user exists in auth but not in DB, create them
        if (!dbUser && user.email) {
            try {
                const newUser = await prisma.user.create({
                    data: {
                        id: user.id,
                        email: user.email,
                        name: user.user_metadata?.name || user.email.split("@")[0],
                        role: user.user_metadata?.role || "USER",
                    },
                });
                console.log("[getUser] Created missing DB user:", newUser.email);
                return newUser;
            } catch (createError) {
                console.error("[getUser] Failed to create DB user:", createError);
                return null;
            }
        }

        return dbUser;
    } catch (error) {
        console.error("[getUser] Error:", error);
        return null;
    }
}
