"use client"

import { createClient } from "@/lib/supabase/client"
import { columns } from "./columns";
import { Task } from "@/types";
import { DataTable } from "./data-table";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { useEffect, useState } from "react";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { TaskGantt } from "@/components/tasks/task-gantt";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, GanttChart } from "lucide-react";

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"table" | "kanban" | "gantt">("table");

    useEffect(() => {
        const fetchTasks = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("tareas")
                .select("*, proyectos(nombre)")
                .order("created_at", { ascending: false });

            if (data) setTasks(data as unknown as Task[]);
            setLoading(false);
        };
        fetchTasks();

        const supabase = createClient();
        const channel = supabase
            .channel('realtime-tasks')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tareas' },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const { data } = await supabase
                            .from('tareas')
                            .select('*, proyectos(nombre)')
                            .eq('id', payload.new.id)
                            .single();
                        if (data) setTasks((prev) => [data as unknown as Task, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('tareas')
                            .select('*, proyectos(nombre)')
                            .eq('id', payload.new.id)
                            .single();
                        if (data) setTasks((prev) => prev.map((t) => t.id === payload.new.id ? (data as unknown as Task) : t));
                    } else if (payload.eventType === 'DELETE') {
                        setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Tareas</h1>
                <div className="flex items-center space-x-2">
                    <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban" | "gantt")} className="bg-slate-900 rounded-md border border-slate-800">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="table" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                                <List className="h-4 w-4 mr-2" />
                                Tabla
                            </TabsTrigger>
                            <TabsTrigger value="kanban" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                                <LayoutGrid className="h-4 w-4 mr-2" />
                                Kanban
                            </TabsTrigger>
                            <TabsTrigger value="gantt" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                                <GanttChart className="h-4 w-4 mr-2" />
                                Gantt
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <CreateTaskButton />
                </div>
            </div>

            {loading ? (
                <div className="text-white">Cargando tareas...</div>
            ) : view === "table" ? (
                <DataTable columns={columns} data={tasks} />
            ) : view === "kanban" ? (
                <div className="flex-1 overflow-hidden min-h-[500px]">
                    <TaskKanban tasks={tasks} />
                </div>
            ) : (
                <div className="flex-1 overflow-hidden min-h-[500px]">
                    <TaskGantt tasks={tasks} />
                </div>
            )}
        </div>
    );
}
