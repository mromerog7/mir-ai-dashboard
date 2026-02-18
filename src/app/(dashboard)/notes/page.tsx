import { NotesClient } from "@/components/notes/notes-client"
import { Header } from "@/components/header"

export default function NotesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-[#02457A]">Notas</h2>
            </div>
            <NotesClient />
        </div>
    )
}
