"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Download, Copy } from "lucide-react"
import { QuoteDetailSheet } from "@/components/quotes/quote-detail-sheet"

import { EditQuoteSheet } from "@/components/quotes/edit-quote-sheet"

// CORRECTED Schema based on user feedback/image
export type Quote = {
    id: number
    folio: string
    cliente: string
    subtotal: number
    iva: number
    total: number // Was monto_total
    estatus: string | null // Was estado
    fecha_emision: string | null // Was fecha_envio
    pdf_url: string | null
    ubicacion: string | null
    items_json: any
    proyecto_id?: number | null // Added
    solicitante?: string | null // Added
    requiere_factura?: boolean | null // Added
    // Relations
    proyectos?: {
        nombre: string
        ubicacion?: string
        solicitante?: string // Added
    } | null
}

export const columns: ColumnDef<Quote>[] = [
    {
        id: "proyecto",
        accessorFn: (row) => row.proyectos?.nombre || "General",
        header: "Proyecto",
        cell: ({ row }) => <span className="font-medium text-blue-400">{row.getValue("proyecto")}</span>
    },
    {
        accessorKey: "cliente",
        header: "Cliente",
        cell: ({ row }) => <div className="text-left text-slate-400">{row.getValue("cliente")}</div>
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
        cell: ({ row }) => <div className="text-center font-medium text-slate-300">{row.getValue("folio")}</div>
    },
    {
        accessorKey: "total",
        header: () => <div className="text-center">Monto</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("total") || "0")
            const formatted = new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
            }).format(amount)
            return <div className="text-center font-medium text-slate-200">{formatted}</div>
        },
    },
    {
        accessorKey: "estatus",
        header: () => <div className="text-center">Estado</div>,
        cell: ({ row }) => {
            const status = row.getValue("estatus") as string
            let variant: "default" | "secondary" | "destructive" | "outline" = "default"
            // Adjust variants based on status values seen in DB image "Borrador"
            if (status === "Aprobada" || status === "Aceptada") variant = "secondary"
            else if (status === "Rechazada") variant = "destructive"
            else if (status === "Borrador") variant = "outline"

            const colorClass = (status === "Aprobada" || status === "Aceptada") ? "bg-blue-600 hover:bg-blue-700" :
                (status === "Enviada") ? "bg-blue-600 hover:bg-blue-700" : undefined;

            return <div className="flex justify-center"><Badge variant={variant} className={colorClass}>{status}</Badge></div>
        }
    },
    {
        accessorKey: "fecha_emision",
        header: () => <div className="text-center">Fecha</div>,
        cell: ({ row }) => {
            const dateStr = row.getValue("fecha_emision") as string
            if (!dateStr) return <div className="text-center font-medium text-slate-500">-</div>;
            // Handle date string (e.g. 2026-02-09)
            // We append T12:00:00 to ensure local time is not shifted by timezone if it's just a date string
            const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
            return <div className="text-center font-medium text-slate-300">{date.toLocaleDateString("es-MX")}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const quote = row.original
            return (
                <div className="flex items-center gap-2 justify-end">
                    <EditQuoteSheet key={quote.id} quote={quote} />
                    <EditQuoteSheet
                        defaultValues={quote}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-purple-400" title="Duplicar">
                                <span className="sr-only">Duplicar Cotización</span>
                                <Copy className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <QuoteDetailSheet quote={quote} />
                    {quote.pdf_url ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800" onClick={() => window.open(quote.pdf_url!, '_blank')} title="Descargar PDF">
                            <span className="sr-only">Descargar PDF</span>
                            <Download className="h-4 w-4 text-blue-400" />
                        </Button>
                    ) : (
                        <span className="text-xs text-slate-500">Sin archivo</span>
                    )}
                </div>
            )
        },
    },
]
