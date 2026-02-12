import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
    const supabase = await createClient();
    const { data: reports } = await supabase
        .from("reportes")
        .select("*, proyectos(nombre)")
        .order("fecha_reporte", { ascending: false });

    return <ReportsClient initialReports={reports || []} />;
}
