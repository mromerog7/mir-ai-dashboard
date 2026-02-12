import { createClient } from "@/lib/supabase/server";
import { ExpensesView } from "./expenses-view";
import { Expense } from "@/types";
import { CreateExpenseSheet } from "@/components/expenses/create-expense-sheet";

export default async function ExpensesPage() {
    const supabase = await createClient();
    const { data: expenses, error } = await supabase
        .from("gastos")
        .select("*, proyectos(nombre, cliente, ubicacion)")
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error fetching expenses:", error);
        return <div className="text-white">Error al cargar gastos.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Gastos</h1>
                <CreateExpenseSheet />
            </div>
            <ExpensesView initialExpenses={expenses as unknown as Expense[]} />
        </div>
    )
}
