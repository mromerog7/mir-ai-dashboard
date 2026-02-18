"use client"

import { createClient } from "@/lib/supabase/client"
import { columns } from "./columns";
import { Task } from "@/types";
import { DataTable } from "./data-table";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { useEffect, useState, lazy, Suspense, useCallback, useMemo } from "react";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, BarChart2, FolderOpen, GitCompareArrows } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { TaskForm } from "@/components/tasks/task-form";

const TaskGantt = lazy(() => import("@/components/tasks/task-gantt").then(m => ({ default: m.TaskGantt })));
const TaskGanttReal = lazy(() => import("@/components/tasks/task-gantt-real").then(m => ({ default: m.TaskGanttReal })));

interface Project {
    id: number;
    nombre: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"table" | "kanban" | "gantt" | "gantt-real">("table");
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

    const handleEditTask = useCallback((task: Task) => {
        setEditingTask(task);
    }, []);

    // Fetch projects for filter
    useEffect(() => {
        const fetchProjects = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("proyectos")
                .select("id, nombre")
                .order("nombre", { ascending: true });
            if (data) setProjects(data);
        };
        fetchProjects();
    }, []);

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

    // Filter tasks by selected project
    const filteredTasks = useMemo(() => {
        if (selectedProjectId === "all") return tasks;
        return tasks.filter(t => t.proyecto_id?.toString() === selectedProjectId);
    }, [tasks, selectedProjectId]);

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-[#02457A]">Tareas</h1>
                <div className="flex items-center space-x-3">
                    {/* Project Filter */}
                    <div className="relative flex items-center">
                        <FolderOpen className="absolute left-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-md pl-8 pr-8 py-1.5 appearance-none cursor-pointer hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Todos los proyectos</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id.toString()}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                        <svg className="absolute right-2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban" | "gantt" | "gantt-real")} className="bg-white rounded-md border border-slate-200">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="table" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500">
                                <List className="h-4 w-4 mr-2" />
                                Tabla
                            </TabsTrigger>
                            <TabsTrigger value="kanban" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500">
                                <LayoutGrid className="h-4 w-4 mr-2" />
                                Kanban
                            </TabsTrigger>
                            <TabsTrigger value="gantt" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500">
                                <BarChart2 className="h-4 w-4 mr-2" />
                                Gantt
                            </TabsTrigger>
                            <TabsTrigger value="gantt-real" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500">
                                <GitCompareArrows className="h-4 w-4 mr-2" />
                                PROG vs REAL
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <CreateTaskButton />
                </div>
            </div>

            {loading ? (
                <div className="text-white">Cargando tareas...</div>
            ) : view === "table" ? (
                <DataTable columns={columns} data={filteredTasks} />
            ) : view === "kanban" ? (
                <div className="flex-1 overflow-hidden min-h-[500px]">
                    <TaskKanban tasks={filteredTasks} />
                </div>
            ) : view === "gantt" ? (
                <Suspense fallback={<div className="text-white p-4">Cargando vista Gantt...</div>}>
                    <div className="flex-1 overflow-hidden min-h-[500px]">
                        <TaskGantt tasks={filteredTasks} onEditTask={handleEditTask} />
                    </div>
                </Suspense>
            ) : (
                <Suspense fallback={<div className="text-white p-4">Cargando vista PROG vs REAL...</div>}>
                    <div className="flex-1 overflow-hidden min-h-[500px]">
                        <TaskGanttReal tasks={filteredTasks} onEditTask={handleEditTask} />
                    </div>
                </Suspense>
            )}

            {/* Shared Edit Task Sheet (used by Gantt view) */}
            <Sheet open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
                <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                    <SheetHeader>
                        <SheetTitle className="text-slate-900">Editar Tarea</SheetTitle>
                        <SheetDescription className="text-slate-400">
                            Modifica los detalles de la tarea.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        {editingTask && (
                            <TaskForm
                                onSuccess={() => setEditingTask(null)}
                                initialData={editingTask}
                                taskId={editingTask.id}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

