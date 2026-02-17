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

    return <MinutesClient initialMinutes={(minutes || []) as any} />
}
