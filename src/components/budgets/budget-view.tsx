"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Budget, BudgetCategory } from "@/types"
import { BudgetTable } from "./budget-table"
import { BudgetSummary } from "./budget-summary"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface BudgetViewProps {
    projectId: number
}

export function BudgetView({ projectId }: BudgetViewProps) {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
    const [categories, setCategories] = useState<BudgetCategory[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch Budgets for Project
    const fetchBudgets = useCallback(async () => {
        setLoading(true)
        const supabase = createClient()

        // 1. Get Budgets
        const { data: budgetsData, error: budgetsError } = await supabase
            .from("presupuestos")
            .select("*")
            .eq("proyecto_id", projectId)
            .order("version", { ascending: false })

        if (budgetsData) {
            setBudgets(budgetsData)

            // Default to latest or selected
            if (!selectedBudget && budgetsData.length > 0) {
                setSelectedBudget(budgetsData[0])
            } else if (selectedBudget) {
                // Refresh currently selected
                const updated = budgetsData.find(b => b.id === selectedBudget.id)
                if (updated) setSelectedBudget(updated)
            }
        }
        setLoading(false)
    }, [projectId, selectedBudget])

    // Fetch Categories and Items for Selected Budget
    const fetchDetails = useCallback(async () => {
        if (!selectedBudget) return

        const supabase = createClient()
        const { data: catsData, error: catsError } = await supabase
            .from("presupuesto_categorias")
            .select("*, items:presupuesto_items(*)") // Nested fetch
            .eq("presupuesto_id", selectedBudget.id)
            .order("orden", { ascending: true })

        if (catsData) {
            // Sort items by key/order if needed, usually DB order is enough or handled by index
            const sortedCats = catsData.map(cat => ({
                ...cat,
                items: cat.items?.sort((a: any, b: any) => a.orden - b.orden)
            }))
            setCategories(sortedCats)
        }
    }, [selectedBudget])

    // Initial Load
    useEffect(() => {
        fetchBudgets()
    }, [projectId])

    // Load details when budget changes
    useEffect(() => {
        if (selectedBudget) {
            fetchDetails()
        } else {
            setCategories([])
        }
    }, [selectedBudget, fetchDetails])


    const handleCreateBudget = async () => {
        setLoading(true)
        const supabase = createClient()

        // Determine version
        const nextVersion = budgets.length > 0 ? Math.max(...budgets.map(b => b.version)) + 1 : 1

        const { data, error } = await supabase
            .from("presupuestos")
            .insert({
                proyecto_id: projectId,
                version: nextVersion,
                nombre: `Versión ${nextVersion}`,
                estatus: "Borrador"
            })
            .select()
            .single()

        if (data) {
            // Create default categories for correct structure?
            // Optional: Pre-fill with standard categories
            await supabase.from("presupuesto_categorias").insert([
                { presupuesto_id: data.id, nombre: "Diseño", orden: 1 },
                { presupuesto_id: data.id, nombre: "Obra Civil", orden: 2 },
            ])

            await fetchBudgets()
            setSelectedBudget(data)
        }
        setLoading(false)
    }

    if (loading && budgets.length === 0) {
        return <div className="p-8 text-center text-slate-500">Cargando presupuestos...</div>
    }

    if (budgets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay presupuestos creados</h3>
                <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                    Comienza creando una primera versión del presupuesto para este proyecto.
                </p>
                <Button onClick={handleCreateBudget} className="bg-[#02457A]">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Presupuesto Inicial
                </Button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {/* Main Content: Table */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-500">Versión:</span>
                        <Select
                            value={selectedBudget?.id.toString()}
                            onValueChange={(val) => {
                                const b = budgets.find(b => b.id.toString() === val)
                                if (b) setSelectedBudget(b)
                            }}
                        >
                            <SelectTrigger className="w-[200px] h-9">
                                <SelectValue placeholder="Seleccionar versión" />
                            </SelectTrigger>
                            <SelectContent>
                                {budgets.map(b => (
                                    <SelectItem key={b.id} value={b.id.toString()}>
                                        {b.nombre} ({b.estatus})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCreateBudget} variant="outline" size="sm" className="h-9">
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Nueva Versión
                    </Button>
                </div>

                {selectedBudget && (
                    <BudgetTable
                        budgetId={selectedBudget.id}
                        categories={categories}
                        onUpdate={fetchDetails}
                    />
                )}
            </div>

            {/* Sidebar: Summary */}
            <div className="lg:col-span-1">
                {selectedBudget && (
                    <BudgetSummary
                        budget={selectedBudget}
                        categories={categories}
                        onUpdate={() => {
                            fetchBudgets() // Refresh budget (totals)
                            fetchDetails()
                        }}
                    />
                )}
            </div>
        </div>
    )
}
