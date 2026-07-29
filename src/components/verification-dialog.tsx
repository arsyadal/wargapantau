"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { verifyTicket } from "@/actions/verification";
import { CheckCircle, XCircle } from "lucide-react";

interface VerificationDialogProps {
    ticketId: string;
    ticketTitle: string;
}

function SubmitButton({ satisfied }: { satisfied: boolean | null }) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending || satisfied === null}
            variant={satisfied ? "default" : "destructive"}
        >
            {pending ? "Memproses..." : satisfied ? "Konfirmasi Selesai" : "Laporkan Pembohongan"}
        </Button>
    );
}

export function VerificationDialog({ ticketId, ticketTitle }: VerificationDialogProps) {
    const [open, setOpen] = useState(false);
    const [satisfied, setSatisfied] = useState<boolean | null>(null);
    const [reasonType, setReasonType] = useState<string>("");
    const [error, setError] = useState<string>("");

    const handleSubmit = async (formData: FormData) => {
        formData.set("ticketId", ticketId);
        formData.set("isSatisfied", String(satisfied));
        if (!satisfied && reasonType) {
            formData.set("reasonType", reasonType);
        }

        const result = await verifyTicket(formData);

        if (result.error) {
            setError(result.error);
        } else {
            setOpen(false);
            // Page will revalidate
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">Verifikasi Penyelesaian</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Verifikasi Penyelesaian Laporan</DialogTitle>
                    <DialogDescription>
                        Apakah masalah &quot;{ticketTitle}&quot; sudah benar-benar terselesaikan?
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant={satisfied === true ? "default" : "outline"}
                                className="h-20 flex-col gap-2"
                                onClick={() => {
                                    setSatisfied(true);
                                    setReasonType("");
                                }}
                            >
                                <CheckCircle className="h-6 w-6" />
                                <span>Ya, Selesai</span>
                            </Button>
                            <Button
                                type="button"
                                variant={satisfied === false ? "destructive" : "outline"}
                                className="h-20 flex-col gap-2"
                                onClick={() => setSatisfied(false)}
                            >
                                <XCircle className="h-6 w-6" />
                                <span>Tidak / Bohong</span>
                            </Button>
                        </div>

                        {satisfied === false && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reasonType">Alasan Penolakan</Label>
                                    <Select onValueChange={setReasonType} value={reasonType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih alasan..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BOHONG">Bohong (Tidak dikerjakan sama sekali)</SelectItem>
                                            <SelectItem value="AKAL_AKALAN">Akal-akalan (Dikerjakan asal-asalan)</SelectItem>
                                            <SelectItem value="TIDAK_SESUAI">Tidak Sesuai (Berbeda dari yang dilaporkan)</SelectItem>
                                            <SelectItem value="OTHER">Lainnya</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="witnessComment">Komentar (Opsional)</Label>
                                    <Textarea
                                        id="witnessComment"
                                        name="witnessComment"
                                        placeholder="Jelaskan mengapa Anda menolak klaim penyelesaian ini..."
                                        rows={3}
                                    />
                                </div>

                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                    <strong>Catatan:</strong> Setelah menolak, Anda dapat mengunggah bukti tandingan
                                    untuk memperkuat klaim Anda.
                                </div>
                            </div>
                        )}

                        {satisfied === true && (
                            <div className="space-y-2">
                                <Label htmlFor="witnessComment">Komentar (Opsional)</Label>
                                <Textarea
                                    id="witnessComment"
                                    name="witnessComment"
                                    placeholder="Tambahkan komentar atau ucapan terima kasih..."
                                    rows={2}
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                {error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <SubmitButton satisfied={satisfied} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
