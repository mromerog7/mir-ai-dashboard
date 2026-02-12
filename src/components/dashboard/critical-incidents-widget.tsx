"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CriticalIncidentsWidgetProps {
    initialCount: number;
}

export function CriticalIncidentsWidget({ initialCount }: CriticalIncidentsWidgetProps) {
    const [count, setCount] = useState(initialCount);
    const supabase = createClient();

    const fetchCount = async () => {
        const { count } = await supabase
            .from("incidencias")
            .select("*", { count: "exact", head: true })
            .in("severidad", ["Alta", "Crítica"])
            .eq("estatus", "Abierta");
        setCount(count || 0);
    };

    useEffect(() => {
        const channel = supabase
            .channel("realtime-incidents-critical")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "incidencias",
                },
                () => {
                    fetchCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <Card className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Incidencias Críticas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-slate-500">Requieren atención</p>
            </CardContent>
        </Card>
    );
}
