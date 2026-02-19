"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Nota } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Eye, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const columns: ColumnDef<Nota>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "titulo",
        header: "Título",
        cell: ({ row }) => {
            return (
                <div className="font-medium text-slate-900">
                    {row.getValue("titulo")}
                </div>
            )
        },
    },
    {
        accessorKey: "proyecto_id",
        header: "Proyecto",
        cell: ({ row }) => {
            const proyecto = row.original.proyectos
            return (
                <div className="text-slate-600 font-medium">
                    {proyecto?.nombre || "General"}
                </div>
            )
        },
    },
    {
        accessorKey: "autor",
        header: "Autor",
        cell: ({ row }) => {
            return (
                <div className="text-slate-600">
                    {row.getValue("autor") || "-"}
                </div>
            )
        },
    },
    {
        accessorKey: "fecha",
        header: "Fecha",
        cell: ({ row }) => {
            const dateStr = row.getValue("fecha") as string
            // Fix timezone issue by treating string as local date
            const date = new Date(dateStr + "T00:00:00")
            return <div className="text-slate-600">{date.toLocaleDateString()}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const nota = row.original

            return (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => (window as any).openNoteSheet?.(nota, false)} // View
                        title="Ver detalle"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => (window as any).openNoteSheet?.(nota, true)} // Edit
                        title="Editar"
                        className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => (window as any).deleteNote?.(nota.id)}
                        title="Eliminar"
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
    },
]
