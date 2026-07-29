"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signUp } from "@/actions/auth";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full gap-2">
            {pending ? "Memproses..." : (
                <>
                    <UserPlus className="h-4 w-4" />
                    Daftar
                </>
            )}
        </Button>
    );
}

export default function RegisterPage() {
    const [error, setError] = useState<string>("");
    const [role, setRole] = useState<string>("USER");

    const handleSubmit = async (formData: FormData) => {
        formData.set("role", role);
        const result = await signUp(formData);
        if (result?.error) {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Daftar di WargaPantau</CardTitle>
                    <CardDescription>
                        Buat akun untuk mulai melaporkan atau memverifikasi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                required
                                minLength={2}
                            />
                        </div>
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
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Saya adalah</Label>
                            <Select onValueChange={setRole} defaultValue="USER">
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih peran..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">Warga / Masyarakat</SelectItem>
                                    <SelectItem value="GOVERNMENT">Pemerintah / Instansi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {role === "GOVERNMENT" && (
                            <div className="space-y-2">
                                <Label htmlFor="department">Nama Instansi/Departemen</Label>
                                <Input
                                    id="department"
                                    name="department"
                                    type="text"
                                    placeholder="Contoh: Dinas PU Kota Jakarta"
                                    required
                                />
                            </div>
                        )}
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
                        Sudah punya akun?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline font-medium">
                            Masuk
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
