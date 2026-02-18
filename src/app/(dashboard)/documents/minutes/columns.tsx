"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, FileText, Eye } from "lucide-react"
import { MinutaDetailSheet } from "@/components/minutes/minuta-detail-sheet"
import { Minuta } from "@/types"

export const columns: ColumnDef<Minuta>[] = [
    {
        id: "proyecto",
        accessorFn: (row) => row.proyectos?.nombre || "General",
        header: "Proyecto",
        cell: ({ row }) => (
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 font-normal">
                {row.getValue("proyecto")}
            </Badge>
        )
    },
    {
        accessorKey: "fecha",
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="pl-0 hover:bg-transparent hover:text-slate-900 text-slate-500">
                    Fecha
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const dateStr = row.getValue("fecha") as string
            if (!dateStr) return <div className="text-slate-500">-</div>;
            const date = new Date(dateStr.split('T')[0] + 'T12:00:00')
            return <div className="font-medium text-slate-900">{date.toLocaleDateString("es-MX", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        },
    },
    {
        accessorKey: "titulo",
        header: "Título / Objetivo",
        cell: ({ row }) => (
            <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-blue-600" />
                <span className="text-slate-900 font-medium">{row.getValue("titulo")}</span>
            </div>
        )
    },
    {
        accessorKey: "participantes",
        header: "Participantes",
        cell: ({ row }) => {
            const parts = (row.getValue("participantes") as string) || ""
            return <div className="text-slate-500 text-sm truncate max-w-[250px]" title={parts}>{parts || "-"}</div>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const minuta = row.original
            return (
                <div className="flex items-center gap-2 justify-end">
                    <MinutaDetailSheet
                        minuta={minuta}
                        readonly={true}
                        trigger={
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-slate-100">
                                <Eye className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <MinutaDetailSheet minuta={minuta} />
                </div>
            )
        },
    },
]
