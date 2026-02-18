"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Task {
    id: number;
    created_at: string;
    titulo: string;
    estatus: string;
    descripcion: string | null;
}

interface PendingTasksWidgetProps {
    initialTasks: Task[];
}

export function PendingTasksWidget({ initialTasks }: PendingTasksWidgetProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const supabase = createClient();

    const fetchTasks = async () => {
        const { data } = await supabase
            .from("tareas")
            .select("id, created_at, titulo, estatus, descripcion")
            .neq("estatus", "Completada")
            .order("created_at", { ascending: false })
            .limit(10);

        if (data) {
            // Sort Logic matches the original page.tsx
            const sorted = data.sort((a, b) => {
                const statusWeight: Record<string, number> = {
                    'Pendiente': 1,
                    'En Proceso': 2,
                    'Revisión': 3
                };
                const weightA = statusWeight[a.estatus || ''] || 4;
                const weightB = statusWeight[b.estatus || ''] || 4;
                return weightA - weightB;
            });
            setTasks(sorted);
        }
    };

    useEffect(() => {
        const channel = supabase
            .channel("realtime-pending-tasks")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tareas",
                },
                () => {
                    fetchTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <Link href="/tasks">
            <Card className="h-full bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardHeader>
                    <CardTitle>Resumen de Tareas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tasks && tasks.length > 0 ? tasks.map((task) => (
                            <div key={task.id} className="flex items-start justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none text-slate-900">{task.titulo}</p>
                                    <p className="text-xs text-slate-500">
                                        {task.descripcion || "Sin descripción"}
                                    </p>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${task.estatus === 'Completada' ? 'bg-blue-100 text-blue-700' :
                                    task.estatus === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {task.estatus || "Pendiente"}
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500">No hay tareas pendientes recientes.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
