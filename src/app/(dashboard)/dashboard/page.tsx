import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
    CloudSun,
    Sun,
    Cloud,
    CloudRain,
    Snowflake,
    CloudLightning,
} from "lucide-react";
import { ActiveProjectsWidget } from "@/components/dashboard/active-projects-widget";
import { MonthExpensesWidget } from "@/components/dashboard/month-expenses-widget";
import { CriticalIncidentsWidget } from "@/components/dashboard/critical-incidents-widget";
import { ActivityFeedWidget } from "@/components/dashboard/activity-feed-widget";
import { PendingTasksWidget } from "@/components/dashboard/pending-tasks-widget";

// Helper to map WMO weather codes
function getWeatherIcon(code: number) {
    if (code === 0) return { icon: Sun, label: "Despejado", color: "text-yellow-500" };
    if (code >= 1 && code <= 3) return { icon: CloudSun, label: "Parcialmente nublado", color: "text-yellow-500" };
    if (code >= 45 && code <= 48) return { icon: Cloud, label: "Niebla", color: "text-slate-500" };
    if (code >= 51 && code <= 67) return { icon: CloudRain, label: "Lluvia ligera", color: "text-blue-500" };
    if (code >= 71 && code <= 77) return { icon: Snowflake, label: "Nieve", color: "text-sky-400" };
    if (code >= 80 && code <= 82) return { icon: CloudRain, label: "Lluvia", color: "text-blue-600" };
    if (code >= 95 && code <= 99) return { icon: CloudLightning, label: "Tormenta", color: "text-purple-600" };
    return { icon: CloudSun, label: "Variable", color: "text-slate-500" };
}

export default async function DashboardPage() {
    const supabase = await createClient();

    // 1. Fetch Active Projects Count
    const { count: activeProjectsCount } = await supabase
        .from("proyectos")
        .select("*", { count: "exact", head: true })
        .neq("status", "Completado");

    // 2. Fetch Incidents (Safe)
    let highRiskIncidents = 0;
    try {
        const { count, error } = await supabase
            .from("incidencias")
            .select("*", { count: "exact", head: true })
            .in("severidad", ["Alta", "Crítica"])
            .eq("estatus", "Abierta");
        if (!error) highRiskIncidents = count || 0;
    } catch (e) {
        console.log("Incidencias table missing/empty");
    }

    // 3. Fetch Expenses (Safe)
    let totalExpenses = 0;
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data } = await supabase
            .from("gastos")
            .select("monto")
            .gte("fecha", startOfMonth.toISOString());

        totalExpenses = data?.reduce((sum, expense) => sum + (Number(expense.monto) || 0), 0) || 0;
    } catch (e) {
        console.log("Gastos table missing/empty");
    }

    // FETCH LATEST ACTIVITIES FROM ALL MODULES
    const limit = 5;
    const [
        { data: recentReports },
        { data: recentSurveys },
        { data: recentQuotes },
        { data: recentExpenses },
        { data: recentTasks },
        { data: recentIncidents },
        { data: pendingTasks },
    ] = await Promise.all([
        supabase.from("reportes").select("fecha_reporte, resumen_titulo").order("fecha_reporte", { ascending: false }).limit(limit),
        supabase.from("levantamientos").select("fecha_visita, folio").order("fecha_visita", { ascending: false }).limit(limit),
        supabase.from("cotizaciones").select("fecha_emision, created_at, folio").order("created_at", { ascending: false }).limit(limit),
        supabase.from("gastos").select("fecha, concepto, monto").order("fecha", { ascending: false }).limit(limit),
        supabase.from("tareas").select("id, created_at, titulo, estatus, descripcion").order("created_at", { ascending: false }).limit(limit), // Kept for Activity Feed
        supabase.from("incidencias").select("fecha_inicio, titulo, severidad").order("fecha_inicio", { ascending: false }).limit(limit),
        supabase.from("tareas")
            .select("id, created_at, titulo, estatus, descripcion")
            .neq("estatus", "Completada")
            .order("created_at", { ascending: false })
            .limit(10), // Limit increased slightly to ensure we have items after sorting
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
        .slice(0, 7); // Show top 7 activities

    // Sort Pending Tasks: Pendiente first, then En Proceso, then others
    const sortedPendingTasks = (pendingTasks || []).sort((a, b: any) => {
        const statusWeight: Record<string, number> = {
            'Pendiente': 1,
            'En Proceso': 2,
            'Revisión': 3
        };
        const weightA = statusWeight[a.estatus || ''] || 4;
        const weightB = statusWeight[b.estatus || ''] || 4;
        return weightA - weightB;
    });

    // 6. Fetch Weather Data (Open-Meteo)
    let weatherData = { temp: 0, code: 0 };
    try {
        const res = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=18.2619&longitude=-93.2250&current=temperature_2m,weather_code&timezone=America%2FMexico_City",
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );
        const data = await res.json();
        if (data.current) {
            weatherData = {
                temp: Math.round(data.current.temperature_2m),
                code: data.current.weather_code
            };
        }
    } catch (e) {
        console.log("Weather fetch error", e);
    }

    const weatherInfo = getWeatherIcon(weatherData.code);
    const WeatherIcon = weatherInfo.icon;

    return (
        <div className="space-y-6">

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/projects">
                    <ActiveProjectsWidget initialCount={activeProjectsCount ?? 0} />
                </Link>

                <Link href="/expenses">
                    <MonthExpensesWidget initialTotal={totalExpenses} />
                </Link>

                <Link href="/incidents">
                    <CriticalIncidentsWidget initialCount={highRiskIncidents} />
                </Link>

                <Link href="/weather">
                    <Card className="bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Clima (Comalcalco)</CardTitle>
                            <WeatherIcon className={`h-4 w-4 ${weatherInfo.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{weatherData.temp}°C</div>
                            <p className="text-xs text-slate-500">{weatherInfo.label}</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <ActivityFeedWidget initialActivities={activities} />
                <PendingTasksWidget initialTasks={sortedPendingTasks} />
            </div>
        </div>
    );
}


