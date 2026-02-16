"use client"

import { useState, useEffect } from "react"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Eye, Calendar, FolderOpen, CheckCircle, AlertTriangle, ChevronDown, DollarSign, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Task } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"

function parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split("T")[0].split("-")
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

interface TaskDetailSheetProps {
    task: Task
    trigger?: React.ReactNode // Allow custom trigger
}

export function TaskDetailSheet({ task, trigger }: TaskDetailSheetProps) {
    const [sheetOpen, setSheetOpen] = useState(false)
    const [linkedIncidents, setLinkedIncidents] = useState<any[]>([])
    const [expandedIncId, setExpandedIncId] = useState<number | null>(null)

    useEffect(() => {
        if (sheetOpen && task.id) {
            const fetchIncidents = async () => {
                const supabase = createClient()
                const { data } = await supabase
                    .from("incidencia_tareas")
                    .select("incidencia_id, incidencias(id, titulo, descripcion, severidad, estatus, fecha_inicio, impacto_costo, impacto_tiempo, proyectos(nombre))")
                    .eq("tarea_id", task.id)
                if (data) {
                    setLinkedIncidents(data.filter(d => d.incidencias).map(d => d.incidencias))
                }
            }
            fetchIncidents()
        }
    }, [sheetOpen, task.id])

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
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
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
                                        {task.fecha_inicio ? format(parseLocalDate(task.fecha_inicio), "PPP", { locale: es }) : "Sin fecha"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha Fin</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-200">
                                        {task.fecha_fin ? format(parseLocalDate(task.fecha_fin), "PPP", { locale: es }) : "Sin fecha"}
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

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Observaciones</h4>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950/50 p-3 rounded-md min-h-[60px]">
                            {task.observaciones || "Sin observaciones."}
                        </div>
                    </div>

                    {/* Incidencias asociadas */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            Incidencias Asociadas
                            {linkedIncidents.length > 0 && (
                                <span className="text-xs bg-red-500/20 text-red-400 rounded-full px-2 py-0.5">{linkedIncidents.length}</span>
                            )}
                        </h4>
                        {linkedIncidents.length > 0 ? (
                            <div className="space-y-2">
                                {linkedIncidents.map((inc: any) => {
                                    const sevColors: Record<string, string> = {
                                        "Baja": "bg-green-500/20 text-green-400",
                                        "Media": "bg-yellow-500/20 text-yellow-400",
                                        "Alta": "bg-orange-500/20 text-orange-400",
                                        "Cr\u00edtica": "bg-red-500/20 text-red-400",
                                    }
                                    const isExpanded = expandedIncId === inc.id
                                    return (
                                        <div key={inc.id} className="bg-slate-950/50 rounded-md border border-slate-800 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedIncId(isExpanded ? null : inc.id)}
                                                className="w-full flex items-center justify-between p-2.5 hover:bg-slate-800/50 transition-colors"
                                            >
                                                <span className="text-sm text-slate-200 truncate flex-1 mr-2 text-left">{inc.titulo}</span>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${sevColors[inc.severidad] || ""}`}>{inc.severidad}</Badge>
                                                    <Badge variant={inc.estatus === "Resuelta" ? "secondary" : "destructive"} className={`text-[10px] px-1.5 py-0 ${inc.estatus === "Resuelta" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{inc.estatus}</Badge>
                                                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                                </div>
                                            </button>
                                            {isExpanded && (
                                                <div className="px-3 pb-3 pt-1 border-t border-slate-800 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                                    {inc.descripcion && (
                                                        <div>
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Descripci\u00f3n</span>
                                                            <p className="text-xs text-slate-300 mt-0.5">{inc.descripcion}</p>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-3 w-3 text-slate-500" />
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Fecha</span>
                                                                <span className="text-xs text-slate-300">{inc.fecha_inicio ? format(parseLocalDate(inc.fecha_inicio), "d MMM yyyy", { locale: es }) : "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <FolderOpen className="h-3 w-3 text-slate-500" />
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Proyecto</span>
                                                                <span className="text-xs text-slate-300">{inc.proyectos?.nombre || "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <DollarSign className="h-3 w-3 text-slate-500" />
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Impacto Costo</span>
                                                                <span className="text-xs text-slate-300">{inc.impacto_costo ? `$${inc.impacto_costo.toLocaleString()}` : "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3 text-slate-500" />
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Impacto Tiempo</span>
                                                                <span className="text-xs text-slate-300">{inc.impacto_tiempo || "N/A"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 bg-slate-950/50 p-3 rounded-md">
                                No hay incidencias asociadas a esta tarea.
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
