"use client"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Eye, Calendar, FolderOpen, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Task } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TaskDetailSheetProps {
    task: Task
    trigger?: React.ReactNode // Allow custom trigger
}

export function TaskDetailSheet({ task, trigger }: TaskDetailSheetProps) {
    const estatus = task.estatus || "Pendiente";
    const normalizedStatus = estatus.toLowerCase();

    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let badgeClass = "text-slate-400 border-slate-700";

    if (normalizedStatus.includes("completada") || normalizedStatus.includes("terminada")) {
        variant = "secondary";
        badgeClass = "bg-green-500/20 text-green-400 border-none";
    } else if (normalizedStatus.includes("pendiente")) {
        variant = "secondary";
        badgeClass = "bg-yellow-500/20 text-yellow-400 border-none";
    } else if (normalizedStatus.includes("en proceso")) {
        variant = "secondary";
        badgeClass = "bg-blue-500/20 text-blue-400 border-none";
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-blue-400">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver Detalles</span>
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-slate-900 border-slate-800 text-white overflow-y-auto pl-8 pr-8">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-white text-xl flex flex-col gap-2 items-start">
                        <span className="break-words w-full text-left">{task.titulo || task.descripcion || "Sin título"}</span>
                        <Badge variant={variant} className={badgeClass}>{estatus}</Badge>
                    </SheetTitle>
                    <SheetDescription className="text-slate-400 text-left">
                        Detalles de la tarea
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Información General</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Proyecto</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <FolderOpen className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-200">{task.proyectos?.nombre || "General"}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Prioridad</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <CheckCircle className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-200">{task.prioridad || "Normal"}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha de Inicio</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-200">
                                        {task.fecha_inicio ? format(new Date(task.fecha_inicio), "PPP", { locale: es }) : "Sin fecha"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha Fin</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-200">
                                        {task.fecha_fin ? format(new Date(task.fecha_fin), "PPP", { locale: es }) : "Sin fecha"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Descripción</h4>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950/50 p-3 rounded-md min-h-[100px]">
                            {task.descripcion || "Sin descripción detallada."}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
