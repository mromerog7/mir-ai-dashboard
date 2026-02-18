"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, DollarSign, Calendar, Tag } from "lucide-react"
import { ExpenseDetailSheet } from "@/components/expenses/expense-detail-sheet"
import { Expense } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Use the exported type from component or redefine if needed. 
// Since we import it, we use it directly.

export const columns: ColumnDef<Expense>[] = [
    {
        id: "proyecto",
        accessorFn: (row) => row.proyectos?.nombre || "General",
        header: "Proyecto",
        cell: ({ row }) => <span className="font-medium text-slate-700">{row.getValue("proyecto")}</span>
    },
    {
        accessorKey: "concepto",
        header: "Concepto",
        cell: ({ row }) => <span className="text-slate-500 truncate block max-w-[300px]" title={row.getValue("concepto")}>{row.getValue("concepto")}</span>
    },
    {
        accessorKey: "monto",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 pl-0"
                >
                    Monto
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className="font-bold text-blue-600">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.getValue("monto"))}
            </div>
        )
    },
    {
        accessorKey: "categoria",
        header: "Categoría",
        cell: ({ row }) => (
            <div className="flex items-center text-slate-500">
                <Tag className="mr-2 h-3 w-3 text-slate-400" />
                <span>{row.getValue("categoria") || "General"}</span>
            </div>
        )
    },
    {
        accessorKey: "fecha",
        header: "Fecha",
        cell: ({ row }) => {
            const dateStr = row.getValue("fecha") as string
            if (!dateStr) return <div className="text-slate-400">-</div>;
            const parseString = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
            const date = new Date(parseString);
            if (isNaN(date.getTime())) return <div className="text-red-500">Fecha inv.</div>;
            return <div className="text-slate-700">{format(date, "dd/MM/yyyy", { locale: es })}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const expense = row.original
            return (
                <div className="flex items-center justify-center">
                    <ExpenseDetailSheet expense={expense} iconOnly={true} />
                </div>
            )
        },
    },
]
