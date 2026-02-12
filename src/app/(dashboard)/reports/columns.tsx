"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Download, Copy, FileText } from "lucide-react"
import { EditReportSheet } from "@/components/reports/edit-report-sheet"
import { ReportDetailSheet } from "@/components/reports/report-detail-sheet"

export type Report = {
    id: number
    proyecto_id: number | null
    folio: string
    titulo: string | null
    resumen_titulo: string
    fecha_reporte: string
    created_at: string
    pdf_final_url: string | null
    fotos_url: string | null
    materiales: string | null
    observaciones: string | null
    solicitante: string | null
    duracion: string | null
    ubicacion: string | null
    tipo: string | null
    proyectos?: {
        nombre: string
        cliente?: string
        ubicacion?: string
    } | null
}

export const columns: ColumnDef<Report>[] = [
    {
        id: "proyecto",
        accessorFn: (row) => row.proyectos?.nombre || "General",
        header: "Proyecto",
        cell: ({ row }) => <span className="font-medium text-emerald-400">{row.getValue("proyecto")}</span>
    },
    {
        accessorKey: "cliente", // accessorKey might not work for nested unless we use accessorFn or it's flattened
        accessorFn: (row) => row.proyectos?.cliente || "-",
        header: "Cliente",
        cell: ({ row }) => <span className="text-slate-400">{row.getValue("cliente")}</span>
    },
    {
        accessorKey: "folio",
        header: ({ column }) => {
            return (
                <div className="flex justify-center w-full">
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Folio
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )
        },
        cell: ({ row }) => <div className="text-center font-medium text-slate-300 bg-slate-800/50 rounded px-2 py-1">{row.getValue("folio") || "S/F"}</div> // Added badge style background
    },
    {
        accessorKey: "resumen_titulo", // or header
        header: "Título / Resumen",
        cell: ({ row }) => (
            <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-slate-500" />
                <span className="text-slate-300">{row.original.resumen_titulo || row.original.titulo || "Sin título"}</span>
            </div>
        )
    },
    {
        accessorKey: "fecha_reporte",
        header: () => <div className="text-center">Fecha</div>,
        cell: ({ row }) => {
            const dateStr = row.getValue("fecha_reporte") as string
            if (!dateStr) return <div className="text-center font-medium text-slate-500">-</div>;
            // Append T12:00:00 to ensure it's treated as noon local time
            const date = new Date(dateStr.split('T')[0] + 'T12:00:00')
            return <div className="text-center font-medium text-slate-300">{date.toLocaleDateString("es-MX")}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const report = row.original
            return (
                <div className="flex items-center gap-2 justify-end">
                    {/* Edit Button */}
                    <EditReportSheet report={report} />

                    {/* Duplicate Button */}
                    <EditReportSheet
                        report={report}
                        isDuplicate={true}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-white" title="Duplicar">
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Duplicar</span>
                            </Button>
                        }
                    />

                    {/* Detail Button */}
                    <ReportDetailSheet report={report} />

                    {/* PDF Button */}
                    {report.pdf_final_url ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800" onClick={() => window.open(report.pdf_final_url!, '_blank')}>
                            <span className="sr-only">Descargar PDF</span>
                            <Download className="h-4 w-4 text-emerald-400" />
                        </Button>
                    ) : (
                        <span className="text-xs text-slate-500">Sin archivo</span>
                    )}
                </div>
            )
        },
    },
]
