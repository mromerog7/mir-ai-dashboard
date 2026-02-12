import { createClient } from "@/lib/supabase/server";
import { Survey } from "./columns";
import { SurveysClient } from "./surveys-client";

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
        <SurveysClient initialSurveys={(surveys as unknown as Survey[]) || []} />
    );
}
