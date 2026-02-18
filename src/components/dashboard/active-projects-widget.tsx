"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ActiveProjectsWidgetProps {
    initialCount: number;
}

export function ActiveProjectsWidget({ initialCount }: ActiveProjectsWidgetProps) {
    const [count, setCount] = useState(initialCount);
    const supabase = createClient();

    useEffect(() => {
        const fetchCount = async () => {
            const { count } = await supabase
                .from("proyectos")
                .select("*", { count: "exact", head: true })
                .neq("status", "Completado");
            setCount(count || 0);
        };

        const channel = supabase
            .channel("realtime-projects-count")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "proyectos",
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
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Proyectos Activos</CardTitle>
                <Briefcase className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-slate-500">En ejecución</p>
            </CardContent>
        </Card>
    );
}
