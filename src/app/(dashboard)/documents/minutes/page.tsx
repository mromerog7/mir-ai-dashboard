import { createClient } from "@/lib/supabase/server"
import { MinutesClient } from "./client"

export const metadata = {
    title: "Minutas | Dashboard",
    description: "Gestión de minutas y acuerdos de reuniones",
}

export default async function MinutesPage() {
    const supabase = await createClient()
    const { data: minutes } = await supabase
        .from("minutas")
        .select("*, proyectos(nombre)")
        .order("fecha", { ascending: false })

    const { data: projects } = await supabase
        .from("proyectos")
        .select("id, nombre")
        .order("nombre", { ascending: true })

    return <MinutesClient initialMinutes={(minutes || []) as any} projects={(projects || []) as any} />
}
