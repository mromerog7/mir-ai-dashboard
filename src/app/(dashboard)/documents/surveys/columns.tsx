"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Download, Copy } from "lucide-react"
import { SurveyDetailSheet } from "@/components/surveys/survey-detail-sheet"
import { EditSurveySheet } from "@/components/surveys/edit-survey-sheet"

export type Survey = {
    id: number
    proyecto_id: number | null
    folio: string
    cliente_prospecto: string | null
    tipo_servicio: string | null
    estatus: string | null
    detalles_tecnicos: string | null // Added field
    fecha_visita: string | null
    requerimientos: string | null
    medidas_aprox: string | null
    tecnicos: string | null
    evidencia_fotos: string[] | string | null
    pdf_final_url: string | null
    created_at: string
    ubicacion: string | null // Added field
    proyectos?: {
        nombre: string
        cliente?: string
        ubicacion?: string
    } | null
}

export const columns: ColumnDef<Survey>[] = [
    {
        id: "proyecto",
        accessorFn: (row) => row.proyectos?.nombre || "General",
        header: "Proyecto",
        cell: ({ row }) => <span className="font-medium text-emerald-400">{row.getValue("proyecto")}</span>
    },
    {
        accessorKey: "cliente_prospecto",
        header: "Cliente", // Left aligned
        cell: ({ row }) => <span className="text-slate-400">{row.getValue("cliente_prospecto") || row.original.proyectos?.cliente || "-"}</span>
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
        cell: ({ row }) => <div className="text-center font-medium text-slate-300">{row.getValue("folio") || "S/F"}</div>
    },
    {
        accessorKey: "fecha_visita",
        header: () => <div className="text-center">Fecha Visita</div>,
        cell: ({ row }) => {
            const dateStr = row.getValue("fecha_visita") as string
            if (!dateStr) return <div className="text-center font-medium text-slate-500">-</div>;
            // Append T12:00:00 to ensure it's treated as noon local time, avoiding timezone shifts
            const date = new Date(dateStr.split('T')[0] + 'T12:00:00')
            return <div className="text-center font-medium text-slate-300">{date.toLocaleDateString("es-MX")}</div>
        },
    },
    {
        accessorKey: "tipo_servicio",
        header: () => <div className="text-center">Tipo de Servicio</div>,
        cell: ({ row }) => <div className="text-center text-slate-400">{row.getValue("tipo_servicio") || "-"}</div>
    },
    {
        accessorKey: "estatus",
        header: () => <div className="text-center">Estatus</div>,
        cell: ({ row }) => {
            const status = row.getValue("estatus") as string
            let variant: "default" | "secondary" | "destructive" | "outline" = "default"

            if (status === "Completado" || status === "Terminado") variant = "secondary"
            else if (status === "Pendiente") variant = "outline"

            const colorClass = (status === "Completado" || status === "Terminado") ? "bg-green-600 hover:bg-green-700" :
                (status === "En Proceso") ? "bg-blue-600 hover:bg-blue-700" : undefined;

            return <div className="flex justify-center"><Badge variant={variant} className={colorClass}>{status}</Badge></div>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const survey = row.original
            return (
                <div className="flex items-center gap-2 justify-end">
                    <EditSurveySheet survey={survey} />
                    <EditSurveySheet
                        survey={survey}
                        isDuplicate={true}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-white" title="Duplicar">
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Duplicar</span>
                            </Button>
                        }
                    />
                    <SurveyDetailSheet survey={survey} />
                    {survey.pdf_final_url ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800" onClick={() => window.open(survey.pdf_final_url!, '_blank')}>
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
