import { redirect } from "next/navigation";
import { getUser } from "@/actions/auth";
import { TicketForm } from "@/components/ticket-form";

export default async function NewTicketPage() {
    const user = await getUser();

    if (!user) {
        redirect("/login?redirectTo=/tickets/new");
    }

    return (
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="container mx-auto px-4 max-w-2xl">
                <TicketForm />
            </div>
        </div>
    );
}
