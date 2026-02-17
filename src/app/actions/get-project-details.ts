"use server"

import { createClient } from "@/lib/supabase/server";
import { Task, Incident, Survey, Quote, Report } from "@/types";

export async function getProjectDetails(projectId: number) {
    const supabase = await createClient();

    // Parallel fetching for performance
    const [tasks, incidents, surveys, quotes, reports] = await Promise.all([
        supabase.from("tareas").select("*, proyectos(nombre)").eq("proyecto_id", projectId).order("created_at", { ascending: false }),
        supabase.from("incidencias").select("*").eq("proyecto_id", projectId).order("fecha_inicio", { ascending: false }),
        supabase.from("levantamientos").select("*").eq("proyecto_id", projectId).order("created_at", { ascending: false }),
        supabase.from("cotizaciones").select("*").eq("proyecto_id", projectId).order("created_at", { ascending: false }),
        supabase.from("reportes").select("*").eq("proyecto_id", projectId).order("created_at", { ascending: false }),
    ]);

    return {
        tasks: (tasks.data || []) as unknown as Task[],
        incidents: (incidents.data || []) as unknown as Incident[],
        surveys: (surveys.data || []) as unknown as Survey[],
        quotes: (quotes.data || []) as unknown as Quote[],
        reports: (reports.data || []) as unknown as Report[],
        errors: {
            tasks: tasks.error,
            incidents: incidents.error,
            surveys: surveys.error,
            quotes: quotes.error,
            reports: reports.error,
        }
    };
}
