import { createClient } from "@/lib/supabase/server";
import { columns } from "./columns";
import { Report } from "@/types";
import { DataTable } from "@/app/(dashboard)/projects/data-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditReportSheet } from "@/components/reports/edit-report-sheet";

export default async function ReportsPage() {
    const supabase = await createClient();

    const { data: reports, error } = await supabase
        .from("reportes")
        .select("*, proyectos(nombre, cliente, ubicacion)")
        .order("fecha_reporte", { ascending: false });

    if (error) {
        return (
            <div className="p-4 space-y-4">
                <h1 className="text-3xl font-bold text-white tracking-tight">Reportes</h1>
                <div className="text-slate-400">
                    <p>No se pudieron cargar los reportes. Asegúrate de crear la tabla 'reportes'.</p>
                    <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-red-400">{error.message}</pre>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Reportes</h1>
                <EditReportSheet trigger={
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Reporte
                    </Button>
                } />
            </div>

            <DataTable columns={columns} data={(reports as unknown as Report[]) || []} />
        </div>
    );
}
