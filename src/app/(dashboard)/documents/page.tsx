import { redirect } from "next/navigation";

export default function DocumentsPage() {
    // For now, redirect to Reports or show a hub. 
    // Let's redirect to reports as default.
    redirect("/documents/reports");
}
