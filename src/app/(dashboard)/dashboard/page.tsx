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
import { ProjectProgressChart } from "@/components/dashboard/project-progress-chart";
import { ProjectBudgetHealthChart } from "@/components/dashboard/project-budget-chart";

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

    // 4. Fetch Comprehensive Project Data for Charts
    let projectsData: any[] | null = [];
    try {
        const { data, error } = await supabase
            .from("proyectos")
            .select(`
                id, 
                nombre, 
                status,
                tareas (estatus),
                presupuestos (total_final),
                gastos (monto)
            `)
            .neq("status", "Completado");

        if (error) {
            console.error("Error fetching dashboard project data:", error);
        } else {
            projectsData = data;
        }
    } catch (err) {
        console.error("Unexpected error fetching dashboard data:", err);
    }

    // Process Data for Progress Chart
    const progressData = (projectsData || []).map(p => {
        const totalTasks = p.tareas?.length || 0;
        const completedTasks = p.tareas?.filter((t: any) =>
            t.estatus === "Completada" || t.estatus === "Terminada"
        ).length || 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            id: p.id,
            nombre: p.nombre,
            completionRate,
            totalTasks,
            completedTasks
        };
    }).sort((a, b) => b.completionRate - a.completionRate); // Sort by highest progress

    // Process Data for Budget Chart
    const budgetData = (projectsData || []).map(p => {
        const presupuestoTotal = p.presupuestos?.reduce((sum: number, item: any) => sum + (Number(item.total_final) || 0), 0) || 0;
        const gastosTotales = p.gastos?.reduce((sum: number, item: any) => sum + (Number(item.monto) || 0), 0) || 0;

        return {
            id: p.id,
            nombre: p.nombre,
            presupuestoTotal,
            gastosTotales
        };
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
                <ProjectProgressChart projects={progressData} />
                <ProjectBudgetHealthChart projects={budgetData} />
            </div>
        </div>
    );
}


