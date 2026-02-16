"use client"

import { Task } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, CheckCircle } from "lucide-react"
import { EditTaskButton } from "@/components/tasks/edit-task-button"
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet"

interface TaskKanbanProps {
    tasks: Task[]
}

const STATUS_COLUMNS = [
    { id: "Pendiente", label: "Pendiente", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" },
    { id: "En Proceso", label: "En Proceso", color: "bg-blue-500/10 border-blue-500/20 text-blue-500" },
    { id: "Revisión", label: "Revisión", color: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
    { id: "Completada", label: "Completada", color: "bg-green-500/10 border-green-500/20 text-green-500" },
]

const PRIORITY_COLORS: Record<string, string> = {
    "Baja": "border-l-4 border-l-green-500",
    "Media": "border-l-4 border-l-yellow-500",
    "Alta": "border-l-4 border-l-orange-500",
    "Urgente": "border-l-4 border-l-red-500",
}

export function TaskKanban({ tasks }: TaskKanbanProps) {
    const getTasksByStatus = (status: string) => {
        return tasks.filter(task => {
            const taskStatus = task.estatus || "Pendiente";
            // Normalize for comparison if needed, but assuming exact match based on Select inputs
            return taskStatus === status;
        })
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
            {STATUS_COLUMNS.map((column) => {
                const columnTasks = getTasksByStatus(column.id)

                return (
                    <div key={column.id} className="min-w-[300px] flex-1 flex flex-col bg-slate-900/50 rounded-lg border border-slate-800 h-full">
                        <div className={`p-3 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10 rounded-t-lg`}>
                            <h3 className={`font-semibold ${column.color.split(" ").pop()}`}>{column.label}</h3>
                            <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-none">
                                {columnTasks.length}
                            </Badge>
                        </div>

                        <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                            {columnTasks.map((task) => (
                                <Card key={task.id} className={`bg-slate-900 border-slate-800 hover:border-slate-700 transition-all ${PRIORITY_COLORS[task.prioridad || "Media"] || PRIORITY_COLORS["Media"]}`}>
                                    <CardHeader className="p-3 pb-2 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 border-slate-700 text-slate-400">
                                                {task.proyectos?.nombre || "General"}
                                            </Badge>
                                            <div className="flex space-x-1">
                                                <EditTaskButton task={task} />
                                                <TaskDetailSheet task={task} />
                                            </div>
                                        </div>
                                        <CardTitle className="text-sm font-medium text-white leading-tight">
                                            {task.titulo}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0 pb-2">
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                                            {task.descripcion || "Sin descripción"}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-3 pt-0 flex justify-between items-center text-xs text-slate-500">
                                        {(task.fecha_inicio || task.fecha_fin) ? (
                                            <div className="flex items-center text-slate-400">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                <span>
                                                    {task.fecha_inicio ? format(new Date(task.fecha_inicio), "dd MMM", { locale: es }) : "?"}
                                                    {" → "}
                                                    {task.fecha_fin ? format(new Date(task.fecha_fin), "dd MMM", { locale: es }) : "?"}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 italic">Sin fechas</span>
                                        )}

                                        <div className="flex items-center" title={`Prioridad: ${task.prioridad}`}>
                                            <div className={`w-2 h-2 rounded-full mr-1 ${task.prioridad === 'Alta' || task.prioridad === 'Urgente' ? 'bg-red-500' :
                                                task.prioridad === 'Media' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`} />
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                            {columnTasks.length === 0 && (
                                <div className="text-center py-8 text-slate-600 text-sm italic">
                                    No hay tareas
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
