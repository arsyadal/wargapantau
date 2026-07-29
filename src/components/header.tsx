"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@prisma/client";
import {
    BarChart3,
    FileText,
    Home,
    LogOut,
    Menu,
    Plus,
    User as UserIcon,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface HeaderProps {
    user: User | null;
}

export function Header({ user }: HeaderProps) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Beranda", icon: Home },
        { href: "/tickets", label: "Laporan", icon: FileText },
        { href: "/statistics", label: "Statistik", icon: BarChart3 },
    ];

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">WargaPantau</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-blue-600",
                                isActive(link.href) ? "text-blue-600" : "text-gray-600"
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    {user ? (
                        <>
                            <Link href="/tickets/new" className="hidden sm:block">
                                <Button size="sm" className="gap-1">
                                    <Plus className="h-4 w-4" />
                                    Lapor
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>
                                                {user.name?.charAt(0).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.name}</p>
                                            <p className="text-xs leading-none text-gray-500">{user.email}</p>
                                            <p className="text-xs leading-none text-blue-600 mt-1">
                                                {user.role === "GOVERNMENT" ? "Pemerintah" : "Warga"}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer">
                                            <UserIcon className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <form action={signOut}>
                                            <button type="submit" className="flex w-full items-center cursor-pointer">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Keluar
                                            </button>
                                        </form>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Masuk</Button>
                            </Link>
                            <Link href="/register" className="hidden sm:block">
                                <Button size="sm">Daftar</Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <nav className="md:hidden border-t border-gray-200 bg-white p-4">
                    <div className="flex flex-col space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center space-x-2 text-sm font-medium transition-colors",
                                    isActive(link.href) ? "text-blue-600" : "text-gray-600"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                        {user && (
                            <Link href="/tickets/new" onClick={() => setMobileMenuOpen(false)}>
                                <Button size="sm" className="w-full gap-1">
                                    <Plus className="h-4 w-4" />
                                    Buat Laporan
                                </Button>
                            </Link>
                        )}
                    </div>
                </nav>
            )}
        </header>
    );
}
