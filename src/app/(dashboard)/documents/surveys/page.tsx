import { createClient } from "@/lib/supabase/server";
import { columns, Survey } from "./columns";
import { DataTable } from "@/app/(dashboard)/projects/data-table";
import { EditSurveySheet } from "@/components/surveys/edit-survey-sheet";
import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";

export default async function SurveysPage() {
    const supabase = await createClient();

    // Fetch surveys with project info
    const { data: surveys, error } = await supabase
        .from("levantamientos")
        .select("*, proyectos(nombre, cliente, ubicacion)")
        .order("fecha_visita", { ascending: false });

    if (error) {
        return (
            <div className="p-4 space-y-4">
                <h1 className="text-3xl font-bold text-white tracking-tight">Levantamientos</h1>
                <div className="text-slate-400">
                    <p>No se pudieron cargar los levantamientos.</p>
                    <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-red-400">{error.message}</pre>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Levantamientos</h1>
                <EditSurveySheet
                    trigger={
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Levantamiento
                        </Button>
                    }
                />
            </div>

            <DataTable columns={columns} data={(surveys as unknown as Survey[]) || []} />
        </div>
    );
}
