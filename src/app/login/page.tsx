"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/actions/auth";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full gap-2">
            {pending ? "Memproses..." : (
                <>
                    <LogIn className="h-4 w-4" />
                    Masuk
                </>
            )}
        </Button>
    );
}

export default function LoginPage() {
    const [error, setError] = useState<string>("");

    const handleSubmit = async (formData: FormData) => {
        const result = await signIn(formData);
        if (result?.error) {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Masuk ke WargaPantau</CardTitle>
                    <CardDescription>
                        Masukkan email dan password Anda untuk melanjutkan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="nama@email.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                {error}
                            </div>
                        )}
                        <SubmitButton />
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-gray-500">
                        Belum punya akun?{" "}
                        <Link href="/register" className="text-blue-600 hover:underline font-medium">
                            Daftar sekarang
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
