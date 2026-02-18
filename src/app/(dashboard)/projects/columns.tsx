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
                >
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }: { row: Row<Project> }) => <span className="font-medium text-blue-400">{row.getValue("nombre")}</span>
    },
    {
        accessorKey: "cliente",
        header: "Cliente",
    },
    {
        accessorKey: "ubicacion",
        header: "Ubicación",
    },
    {
        accessorKey: "status",
        header: "Estatus",
        cell: ({ row }: { row: Row<Project> }) => {
            const status = row.getValue("status") as string
            return <Badge variant={status === "Completado" ? "secondary" : "default"}>{status}</Badge>
        }
    },
    {
        accessorKey: "fecha_inicio",
        header: () => <div className="text-center">Inicio</div>,
        cell: ({ row }: { row: Row<Project> }) => {
            const dateStr = row.getValue("fecha_inicio") as string
            // Append T00:00:00 to force local time interpretation or just split
            // Simpler: use the string directly if it's YYYY-MM-DD
            if (!dateStr) return <div className="text-center">-</div>

            // Fix: Treat YYYY-MM-DD as local date by appending time, or just format the string
            // Using timeZone: 'UTC' effectively treats the UTC midnight as the date we want to show
            const date = new Date(dateStr)
            return <div className="text-center font-medium">{date.toLocaleDateString("es-MX", { timeZone: 'UTC' })}</div>
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
