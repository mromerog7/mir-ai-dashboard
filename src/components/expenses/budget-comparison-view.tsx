"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingDown, TrendingUp, AlertCircle } from "lucide-react"
import { CreateExpenseSheet } from "@/components/expenses/create-expense-sheet"

interface BudgetComparisonViewProps {
    projectId: number | null
}

interface CategoryComparison {
    category: string
    budgeted: number
    spent: number
    variance: number
    percentage: number
}

export function BudgetComparisonView({ projectId }: BudgetComparisonViewProps) {
    const [loading, setLoading] = useState(false)
    const [comparisonData, setComparisonData] = useState<CategoryComparison[]>([])
    const [totalBudget, setTotalBudget] = useState(0)
    const [totalSpent, setTotalSpent] = useState(0)
    const [activeBudgetId, setActiveBudgetId] = useState<number | null>(null)
    const [budgetCategoryNames, setBudgetCategoryNames] = useState<string[]>([])
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        if (!projectId) {
            setComparisonData([])
            setTotalBudget(0)
            setTotalSpent(0)
            setActiveBudgetId(null)
            setBudgetCategoryNames([])
            return
        }

        const fetchData = async () => {
            setLoading(true)
            const supabase = createClient()

            try {
                // 1. Fetch Active Budget (Concepts)
                // We need to find the latest budget first
                const { data: budget } = await supabase
                    .from("presupuestos")
                    .select("id")
                    .eq("proyecto_id", projectId)
                    .order("version", { ascending: false })
                    .limit(1)
                    .single()

                let budgetItems: { categoria: string, costo_total: number }[] = []

                if (budget) {
                    setActiveBudgetId(budget.id)
                    // Fetch Categories with nested Items (using the working pattern from BudgetView)
                    // Note: costo_total does not exist in DB, it is calculated
                    const { data: catsData, error: catsError } = await supabase
                        .from("presupuesto_categorias")
                        .select("id, nombre, items:presupuesto_items(cantidad, costo_unitario)")
                        .eq("presupuesto_id", budget.id)

                    if (catsError) {
                        console.error("Error fetching budget categories:", catsError)
                    }

                    // Map budget by category name
                    const budgetMap = new Map<string, number>()

                    if (catsData) {
                        catsData.forEach((cat: any) => {
                            const catName = cat.nombre
                            // Calculate total for this category
                            const catTotal = cat.items?.reduce((sum: number, item: any) => {
                                return sum + ((item.cantidad || 0) * (item.costo_unitario || 0))
                            }, 0) || 0

                            budgetMap.set(catName, (budgetMap.get(catName) || 0) + catTotal)
                        })

                        budgetItems = Array.from(budgetMap.entries()).map(([categoria, costo_total]) => ({ categoria, costo_total }))
                        setBudgetCategoryNames(Array.from(budgetMap.keys()))
                    }
                }

                // 2. Fetch Expenses
                const { data: expenses } = await supabase
                    .from("gastos")
                    .select("categoria, monto")
                    .eq("proyecto_id", projectId)

                // 3. Aggregate Data
                const comparisonMap = new Map<string, { budgeted: number, spent: number }>()

                // Process Budget
                budgetItems.forEach(item => {
                    const existing = comparisonMap.get(item.categoria) || { budgeted: 0, spent: 0 }
                    existing.budgeted += item.costo_total
                    comparisonMap.set(item.categoria, existing)
                })

                // Process Expenses
                expenses?.forEach(expense => {
                    // Expenses store category name directly
                    const catName = expense.categoria
                    const existing = comparisonMap.get(catName) || { budgeted: 0, spent: 0 }
                    existing.spent += expense.monto
                    comparisonMap.set(catName, existing)
                })

                // Convert to Array
                const result: CategoryComparison[] = Array.from(comparisonMap.entries()).map(([category, vals]) => ({
                    category,
                    budgeted: vals.budgeted,
                    spent: vals.spent,
                    variance: vals.budgeted - vals.spent,
                    percentage: vals.budgeted > 0 ? (vals.spent / vals.budgeted) * 100 : (vals.spent > 0 ? 100 : 0)
                }))

                // Calculate Totals
                const totBudget = result.reduce((acc, curr) => acc + curr.budgeted, 0)
                const totSpent = result.reduce((acc, curr) => acc + curr.spent, 0)

                setTotalBudget(totBudget)
                setTotalSpent(totSpent)
                setComparisonData(result.sort((a, b) => b.spent - a.spent)) // Sort by highest spenders

            } catch (error) {
                console.error("Error fetching comparison data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        const supabase = createClient()
        const channel = supabase
            .channel('budget-comparison-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'gastos',
                    filter: `proyecto_id=eq.${projectId}`
                },
                (payload) => {
                    console.log('Realtime update received:', payload)
                    setRefreshTrigger(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId, refreshTrigger])

    if (!projectId) return null // Don't show if no project selected (or show generic message)

    const totalVariance = totalBudget - totalSpent
    const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    return (
        <Card className="bg-white border-slate-200 mb-8 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-[#02457A] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span>Comparativa: Real vs Programado</span>
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                    </div>
                    {projectId && <CreateExpenseSheet defaultProjectId={projectId} defaultBudgetId={activeBudgetId || undefined} preloadedCategories={budgetCategoryNames} />}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-xs text-slate-500 uppercase font-semibold">Presupuestado</span>
                        <div className="text-xl font-bold text-slate-700">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalBudget)}
                        </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <span className="text-xs text-blue-600 uppercase font-semibold">Gastado (Real)</span>
                        <div className="text-xl font-bold text-blue-700">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalSpent)}
                        </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${totalVariance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <span className={`text-xs uppercase font-semibold ${totalVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Diferencia</span>
                        <div className={`text-xl font-bold ${totalVariance >= 0 ? 'text-emerald-700' : 'text-red-700'} flex items-center gap-2`}>
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalVariance)}
                            {totalVariance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-center">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-600">Ejecución</span>
                            <span className="font-bold text-slate-900">{totalPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(totalPercentage, 100)} className={`h-2 ${totalPercentage > 100 ? 'bg-red-100' : 'bg-slate-200'}`} indicatorClassName={totalPercentage > 100 ? 'bg-red-500' : (totalPercentage > 80 ? 'bg-orange-500' : 'bg-blue-500')} />
                    </div>
                </div>

                {/* Detailed List */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-900 border-b border-slate-100 pb-2">Desglose por Categoría</h4>
                    {comparisonData.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 italic">
                            No hay datos para comparar en este proyecto.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {comparisonData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm hover:bg-slate-50 p-2 rounded transition-colors group">
                                    <div className="w-1/3 min-w-[150px]">
                                        <div className="font-medium text-slate-700">{item.category}</div>
                                        <div className="text-xs text-slate-400">
                                            Presup: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(item.budgeted)}
                                        </div>
                                    </div>
                                    <div className="flex-1 px-4">
                                        <div className="flex justify-between text-xs mb-1 text-slate-500">
                                            <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(item.spent)}</span>
                                            <span className={item.percentage > 100 ? "text-red-500 font-bold" : ""}>{item.percentage.toFixed(0)}%</span>
                                        </div>
                                        <Progress
                                            value={Math.min(item.percentage, 100)}
                                            className="h-1.5"
                                            indicatorClassName={item.percentage > 100 ? 'bg-red-500' : (item.percentage > 90 ? 'bg-orange-500' : 'bg-blue-500')}
                                        />
                                    </div>
                                    <div className="w-24 text-right font-medium text-slate-600">
                                        <span className={item.variance < 0 ? "text-red-600" : "text-emerald-600"}>
                                            {item.variance < 0 ? '-' : '+'}{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Math.abs(item.variance))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
