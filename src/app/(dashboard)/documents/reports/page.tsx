import { createClient } from "@/lib/supabase/server";
import { PdfList } from "@/components/documents/pdf-list";

export default async function ReportsPage() {
    const supabase = await createClient();
    const { data: reports } = await supabase
        .from("reportes")
        .select("*, proyectos(nombre)")
        .order("fecha_reporte", { ascending: false });

    return <PdfList title="Reportes de Actividad" items={reports || []} type="report" />;
}
