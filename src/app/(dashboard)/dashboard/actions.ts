"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchLatestActivities() {
    const supabase = await createClient();
    const limit = 5;

    const [
        { data: recentReports },
        { data: recentSurveys },
        { data: recentQuotes },
        { data: recentExpenses },
        { data: recentTasks },
        { data: recentIncidents },
    ] = await Promise.all([
        supabase.from("reportes").select("fecha_reporte, resumen_titulo").order("fecha_reporte", { ascending: false }).limit(limit),
        supabase.from("levantamientos").select("fecha_visita, folio").order("fecha_visita", { ascending: false }).limit(limit),
        supabase.from("cotizaciones").select("fecha_emision, created_at, folio").order("created_at", { ascending: false }).limit(limit),
        supabase.from("gastos").select("fecha, concepto, monto").order("fecha", { ascending: false }).limit(limit),
        supabase.from("tareas").select("id, created_at, titulo, estatus, descripcion").order("created_at", { ascending: false }).limit(limit),
        supabase.from("incidencias").select("fecha_inicio, titulo, severidad").order("fecha_inicio", { ascending: false }).limit(limit),
    ]);

    // Build consolidated activity list
    const activities = [
        ...(recentReports || []).map(r => ({
            type: 'reporte',
            date: r.fecha_reporte,
            description: `Reporte: ${r.resumen_titulo}`
        })),
        ...(recentSurveys || []).map(s => ({
            type: 'levantamiento',
            date: s.fecha_visita,
            description: `Levantamiento: ${s.folio}`
        })),
        ...(recentQuotes || []).map(q => ({
            type: 'cotizacion',
            date: q.fecha_emision || q.created_at,
            description: `Cotización: ${q.folio}`
        })),
        ...(recentExpenses || []).map(e => ({
            type: 'gasto',
            date: e.fecha,
            description: `Gasto: ${e.concepto} - ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(e.monto)}`
        })),
        ...(recentTasks || []).map(t => ({
            type: 'tarea',
            date: t.created_at,
            description: `Tarea: ${t.titulo} (${t.estatus})`
        })),
        ...(recentIncidents || []).map(i => ({
            type: 'incidencia',
            date: i.fecha_inicio,
            description: `Incidencia: ${i.titulo} (${i.severidad})`
        }))
    ]
        // Filter invalid dates and sort
        .filter(a => a.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7)
        .map(a => ({
            ...a,
            // Convert to string to avoid serialization issues if needed, but strings are fine
        }));

    return activities;
}
