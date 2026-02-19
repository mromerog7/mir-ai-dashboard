"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, DollarSign, Calendar, Tag, Pencil, Trash2 } from "lucide-react"
import { ExpenseDetailSheet } from "@/components/expenses/expense-detail-sheet"
import { EditExpenseSheet } from "@/components/expenses/edit-expense-sheet"
import { Expense } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
        cell: ({ row }) => <ActionCell expense={row.original} />
    },
]

const ActionCell = ({ expense }: { expense: Expense }) => {
    const [showEditSheet, setShowEditSheet] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.")
        if (!confirmed) return

        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('gastos')
                .delete()
                .eq('id', expense.id)

            if (error) throw error

            router.refresh()
        } catch (error) {
            console.error("Error deleting expense:", error)
            alert("Error al eliminar el gasto")
        }
    }

    return (
        <div className="flex items-center justify-end gap-1">
            <ExpenseDetailSheet expense={expense} iconOnly={true} />

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                onClick={() => setShowEditSheet(true)}
                title="Editar Gasto"
            >
                <Pencil className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                title="Eliminar Gasto"
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            {showEditSheet && (
                <EditExpenseSheet
                    expense={expense}
                    open={showEditSheet}
                    onOpenChange={setShowEditSheet}
                />
            )}
        </div>
    )
}
