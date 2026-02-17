import { createClient } from "@/lib/supabase/server";
import { IncidentsView } from "./incidents-view";
import { Incident } from "@/types";

export default async function IncidentsPage() {
    const supabase = await createClient();
    const { data: incidents, error } = await supabase
        .from("incidencias")
        .select("*, proyectos(nombre, cliente, ubicacion), incidencia_tareas(tarea_id, tareas(titulo))")
        .order("estatus", { ascending: true }) // Open first
        .order("severidad", { ascending: false }) // Show critical first
        .order("fecha_inicio", { ascending: false });

    if (error) {
        console.error("Error fetching incidents:", error);
        return <div className="text-white">Error al cargar incidencias.</div>;
    }

    return (
        <IncidentsView initialIncidents={incidents as unknown as Incident[]} />
    );
}
