import { createClient } from "@/lib/supabase/server"
import { ClientMeetingsClient } from "./client"
import { redirect } from "next/navigation"

export default async function ClientMeetingsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect("/login")
    }

    // Fetch meetings
    const { data: meetings } = await supabase
        .from("reuniones_clientes")
        .select("*, proyectos(nombre)")
        .order("fecha", { ascending: false })

    // Fetch projects for filter
    const { data: projects } = await supabase
        .from("proyectos")
        .select("id, nombre")
        .order("nombre")

    return (
        <ClientMeetingsClient
            initialMeetings={meetings || []}
            projects={projects || []}
        />
    )
}
