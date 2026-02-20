import { createClient } from "@/lib/supabase/server"
import { FinanzasView } from "@/components/finanzas/finanzas-view"

export default async function FinanzasPage() {
    const supabase = await createClient()

    const [ingresos, gastosOp, retiros, proyectos] = await Promise.all([
        supabase.from("finanzas_ingresos").select("*, proyectos(nombre)").order("fecha", { ascending: false }),
        supabase.from("finanzas_gastos_operacion").select("*").order("fecha", { ascending: false }),
        supabase.from("finanzas_retiros").select("*").order("fecha", { ascending: false }),
        supabase.from("proyectos").select("id, nombre").order("nombre"),
    ])

    return (
        <FinanzasView
            initialIngresos={ingresos.data ?? []}
            initialGastosOp={gastosOp.data ?? []}
            initialRetiros={retiros.data ?? []}
            projects={proyectos.data ?? []}
        />
    )
}
