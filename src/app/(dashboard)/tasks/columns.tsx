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
        cell: ({ row }) => <span className="font-medium text-blue-600">{row.getValue("proyecto")}</span>
    },
    {
        accessorKey: "titulo",
        header: "Título",
        cell: ({ row }) => <span className="font-medium text-slate-900">{row.getValue("titulo")}</span>
    },
    {
        accessorKey: "descripcion",
        header: "Descripción",
        cell: ({ row }) => <span className="text-slate-500 font-medium truncate max-w-[200px] block" title={row.getValue("descripcion") || ""}>{row.getValue("descripcion") || "Sin descripción"}</span>
    },
    {
        accessorKey: "estatus",
        header: "Estatus",
        cell: ({ row }) => {
            const estatus = row.getValue("estatus") as string
            // Normalize status for styling
            const normalizedStatus = estatus ? estatus.toLowerCase() : "";

            let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
            let className = "text-slate-500 border-slate-200";

            if (normalizedStatus.includes("completada") || normalizedStatus.includes("terminada")) {
                variant = "secondary";
                className = "bg-green-100 text-green-700 hover:bg-green-200 border-none";
            } else if (normalizedStatus.includes("pendiente")) {
                variant = "secondary";
                className = "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none";
            } else if (normalizedStatus.includes("en proceso") || normalizedStatus.includes("curso")) {
                variant = "secondary";
                className = "bg-blue-100 text-blue-700 hover:bg-blue-200 border-none";
            } else if (normalizedStatus.includes("revisión") || normalizedStatus.includes("revision")) {
                variant = "secondary";
                className = "bg-orange-100 text-orange-700 hover:bg-orange-200 border-none";
            } else if (normalizedStatus.includes("cancelada")) {
                variant = "destructive";
                className = "bg-red-100 text-red-700 hover:bg-red-200 border-none";
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
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 pl-0"
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
            if (!inicio && !fin) return <div className="text-slate-400">—</div>;
            return (
                <div className="flex items-center text-slate-700 text-sm">
                    <Calendar className="mr-2 h-3 w-3 text-slate-400" />
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
