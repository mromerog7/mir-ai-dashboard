"use client"

import { ColumnDef, Column, Row } from "@tanstack/react-table"
import { Project } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ProjectDetailSheet } from "@/components/projects/project-detail-sheet"
import { EditProjectButton } from "@/components/projects/edit-project-button"

export const columns: ColumnDef<Project>[] = [
    {
        accessorKey: "nombre",
        header: ({ column }: { column: Column<Project, unknown> }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 pl-0"
                >
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }: { row: Row<Project> }) => <span className="font-medium text-blue-600">{row.getValue("nombre")}</span>
    },
    {
        accessorKey: "cliente",
        header: "Cliente",
        cell: ({ row }) => <span className="text-slate-700">{row.getValue("cliente") || "-"}</span>
    },
    {
        accessorKey: "ubicacion",
        header: "Ubicación",
        cell: ({ row }) => <span className="text-slate-500">{row.getValue("ubicacion") || "-"}</span>
    },
    {
        accessorKey: "status",
        header: "Estatus",
        cell: ({ row }: { row: Row<Project> }) => {
            const status = row.getValue("status") as string
            return <Badge variant={status === "Completado" ? "secondary" : "default"} className={status === "Completado" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-blue-600 text-white hover:bg-blue-700"}>{status}</Badge>
        }
    },
    {
        accessorKey: "fecha_inicio",
        header: () => <div className="text-center text-slate-500">Inicio</div>,
        cell: ({ row }: { row: Row<Project> }) => {
            const dateStr = row.getValue("fecha_inicio") as string
            if (!dateStr) return <div className="text-center text-slate-400">-</div>

            const date = new Date(dateStr)
            return <div className="text-center font-medium text-slate-700">{date.toLocaleDateString("es-MX", { timeZone: 'UTC' })}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }: { row: Row<Project> }) => {
            const project = row.original
            return (
                <div className="flex justify-center space-x-2">
                    <EditProjectButton project={project} />
                    <ProjectDetailSheet project={project} />
                </div>
            )
        },
    },
]
