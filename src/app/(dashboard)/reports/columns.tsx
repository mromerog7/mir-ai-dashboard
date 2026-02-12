"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, FileText, Download, Copy } from "lucide-react"
import { ReportDetailSheet } from "@/components/reports/report-detail-sheet"
import { EditReportSheet } from "@/components/reports/edit-report-sheet"

// Define the shape of our data (matches Supabase schema)
import { Report } from "@/types"

export const columns: ColumnDef<Report>[] = [
    {
        id: "proyecto",
        accessorFn: (row) => row.proyectos?.nombre || "General",
        header: "Proyecto",
        cell: ({ row }) => <span className="font-medium text-emerald-400">{row.getValue("proyecto")}</span>
    },
    {
        accessorKey: "cliente",
        header: "Cliente",
        cell: ({ row }) => <span className="text-slate-400">{row.original.proyectos?.cliente || "-"}</span>
    },
    {
        accessorKey: "resumen_titulo",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Título / Resumen
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return (
                <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-slate-400" />
                    <span>{row.getValue("resumen_titulo")}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "folio",
        header: () => <div className="text-center">Folio</div>,
        cell: ({ row }) => <div className="flex justify-center"><Badge variant="outline" className="text-slate-400 border-slate-700">{row.getValue("folio") || "S/F"}</Badge></div>,
    },
    {
        accessorKey: "fecha_reporte",
        header: () => <div className="text-center">Fecha</div>,
        cell: ({ row }) => {
            const dateStr = row.getValue("fecha_reporte") as string
            if (!dateStr) return <div className="text-center font-medium text-slate-500">-</div>;
            const date = new Date(dateStr)
            return <div className="text-center font-medium text-slate-300">{date.toLocaleDateString("es-MX", { timeZone: "UTC" })}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const report = row.original
            return (
                <div className="flex justify-end gap-2">
                    <EditReportSheet report={report} />
                    <EditReportSheet
                        report={report}
                        isDuplicate={true}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-purple-400" title="Duplicar Reporte">
                                <span className="sr-only">Duplicar Reporte</span>
                                <Copy className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <ReportDetailSheet report={report} />
                    {report.pdf_final_url ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800" onClick={() => window.open(report.pdf_final_url!, '_blank')} title="Descargar PDF">
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
