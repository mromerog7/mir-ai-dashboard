"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Task } from "@/types"
import { EditTaskButton } from "@/components/tasks/edit-task-button"

import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet"

function parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split("T")[0].split("-")
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

export const columns: ColumnDef<Task>[] = [
    {
        id: "proyecto",
        accessorFn: (row) => row.proyectos?.nombre || "General",
        header: "Proyecto",
        cell: ({ row }) => <span className="font-medium text-blue-400">{row.getValue("proyecto")}</span>
    },
    {
        accessorKey: "titulo",
        header: "Título",
        cell: ({ row }) => <span className="font-medium text-white">{row.getValue("titulo")}</span>
    },
    {
        accessorKey: "descripcion",
        header: "Descripción",
        cell: ({ row }) => <span className="text-slate-300 font-medium truncate max-w-[200px] block" title={row.getValue("descripcion") || ""}>{row.getValue("descripcion") || "Sin descripción"}</span>
    },
    {
        accessorKey: "estatus",
        header: "Estatus",
        cell: ({ row }) => {
            const estatus = row.getValue("estatus") as string
            // Normalize status for styling
            const normalizedStatus = estatus ? estatus.toLowerCase() : "";

            let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
            let className = "text-slate-400 border-slate-700";

            if (normalizedStatus.includes("completada") || normalizedStatus.includes("terminada")) {
                variant = "secondary";
                className = "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none";
            } else if (normalizedStatus.includes("pendiente")) {
                variant = "secondary";
                className = "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-none";
            } else if (normalizedStatus.includes("en proceso") || normalizedStatus.includes("curso")) {
                variant = "secondary";
                className = "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none";
            } else if (normalizedStatus.includes("revisión") || normalizedStatus.includes("revision")) {
                variant = "secondary";
                className = "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-none";
            } else if (normalizedStatus.includes("cancelada")) {
                variant = "destructive";
                className = "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-none";
            } else if (normalizedStatus.includes("retrasada") || normalizedStatus.includes("urgente")) {
                variant = "destructive";
            }

            return <Badge variant={variant} className={className}>{estatus || "Desconocido"}</Badge>
        }
    },
    {
        id: "fecha_rango",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Fechas
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        accessorFn: (row) => row.fecha_inicio || "",
        cell: ({ row }) => {
            const inicio = row.original.fecha_inicio
            const fin = row.original.fecha_fin
            if (!inicio && !fin) return <div className="text-slate-500">—</div>;
            return (
                <div className="flex items-center text-slate-300 text-sm">
                    <Calendar className="mr-2 h-3 w-3 text-slate-500" />
                    <span>
                        {inicio ? format(parseLocalDate(inicio), "dd MMM", { locale: es }) : "?"}
                        {" → "}
                        {fin ? format(parseLocalDate(fin), "dd MMM", { locale: es }) : "?"}
                    </span>
                </div>
            )
        },
    },
    {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
            const task = row.original
            return (
                <div className="flex justify-center space-x-2">
                    <EditTaskButton task={task} />
                    <TaskDetailSheet task={task} />
                </div>
            )
        },
    },
]
