"use server"

import { createClient } from "@/lib/supabase/server";
import { Task, Incident, Survey, Quote, Report, Minuta, ClientMeeting } from "@/types";

export async function getProjectDetails(projectId: number) {
    const supabase = await createClient();

    // Parallel fetching for performance
    const [tasks, incidents, surveys, quotes, reports, minutas, clientMeetings] = await Promise.all([
        supabase.from("tareas").select("*, proyectos(nombre)").eq("proyecto_id", projectId).order("created_at", { ascending: false }),
        supabase.from("incidencias").select("*, proyectos(nombre, ubicacion), incidencia_tareas(tareas(titulo))").eq("proyecto_id", projectId).order("fecha_inicio", { ascending: false }),
        supabase.from("levantamientos").select("*").eq("proyecto_id", projectId).order("created_at", { ascending: false }),
        supabase.from("cotizaciones").select("*").eq("proyecto_id", projectId).order("created_at", { ascending: false }),
        supabase.from("reportes").select("*").eq("proyecto_id", projectId).order("created_at", { ascending: false }),
        supabase.from("minutas").select("*, proyectos(nombre)").eq("proyecto_id", projectId).order("fecha", { ascending: false }),
        supabase.from("reuniones_clientes").select("*, proyectos(nombre)").eq("proyecto_id", projectId).order("fecha", { ascending: false }),
    ]);

    return {
        tasks: (tasks.data || []) as unknown as Task[],
        incidents: (incidents.data || []) as unknown as Incident[],
        surveys: (surveys.data || []) as unknown as Survey[],
        quotes: (quotes.data || []) as unknown as Quote[],
        reports: (reports.data || []) as unknown as Report[],
        minutas: (minutas.data || []) as unknown as Minuta[],
        clientMeetings: (clientMeetings.data || []) as unknown as ClientMeeting[],
        errors: {
            tasks: tasks.error,
            incidents: incidents.error,
            surveys: surveys.error,
            quotes: quotes.error,
            reports: reports.error,
            minutas: minutas.error,
            clientMeetings: clientMeetings.error,
        }
    };
}
