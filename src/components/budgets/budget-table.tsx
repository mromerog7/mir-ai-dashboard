"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Budget, BudgetCategory, BudgetItem } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, GripVertical, ChevronDown } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface BudgetTableProps {
    budgetId: number
    categories: BudgetCategory[]
    onUpdate: () => void
}

export function BudgetTable({ budgetId, categories, onUpdate }: BudgetTableProps) {
    const [loading, setLoading] = useState(false)
    const [editingItem, setEditingItem] = useState<number | null>(null)
    const [localItems, setLocalItems] = useState<Record<number, BudgetItem[]>>({})
    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({})

    // Initialize local state from props
    useEffect(() => {
        const itemsMap: Record<number, BudgetItem[]> = {}
        const expandedMap: Record<number, boolean> = {}

        categories.forEach(cat => {
            itemsMap[cat.id] = cat.items || []
            expandedMap[cat.id] = true // Default expanded
        })

        setLocalItems(itemsMap)
        setExpandedCategories(expandedMap)
    }, [categories])

    const toggleCategory = (catId: number) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }))
    }

    const handleAddItem = async (categoryId: number) => {
        setLoading(true)
        const supabase = createClient()

        const newItem = {
            categoria_id: categoryId,
            concepto: "Nuevo Concepto",
            unidad: "pza",
            cantidad: 1,
            costo_unitario: 0,
            prec_venta_unitario: 0,
            orden: (localItems[categoryId]?.length || 0) + 1
        }

        const { data, error } = await supabase
            .from("presupuesto_items")
            .insert(newItem)
            .select()
            .single()

        if (error) {
            console.error("Error adding item:", error)
        } else if (data) {
            onUpdate() // Refresh parent to get fresh data
        }
        setLoading(false)
    }

    const handleLocalChange = (itemId: number, field: keyof BudgetItem, value: any) => {
        const catId = Object.keys(localItems).find(key =>
            localItems[parseInt(key)].some(item => item.id === itemId)
        )

        if (catId) {
            const categoryId = parseInt(catId)
            setLocalItems(prev => ({
                ...prev,
                [categoryId]: prev[categoryId].map(item =>
                    item.id === itemId ? { ...item, [field]: value } : item
                )
            }))
        }
    }

    const handleBlurItem = async (itemId: number, updates: Partial<BudgetItem>) => {
        // Debounce actual DB update could be implemented here for performance
        // For now direct update on blur
        const supabase = createClient()
        const { error } = await supabase
            .from("presupuesto_items")
            .update(updates)
            .eq("id", itemId)

        if (error) {
            console.error("Error updating item:", error)
            onUpdate() // Revert on error (re-fetch)
        } else {
            onUpdate() // Sync calculations
        }
    }

    const handleDeleteItem = async (itemId: number) => {
        if (!confirm("¿Eliminar este concepto?")) return

        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase
            .from("presupuesto_items")
            .delete()
            .eq("id", itemId)

        if (error) {
            console.error("Error deleting item:", error)
        } else {
            onUpdate()
        }
        setLoading(false)
    }

    const handleAddCategory = async () => {
        const name = prompt("Nombre de la nueva categoría:")
        if (!name) return

        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase
            .from("presupuesto_categorias")
            .insert({
                presupuesto_id: budgetId,
                nombre: name,
                orden: categories.length + 1
            })

        if (error) {
            console.error("Error adding category:", error)
        } else {
            onUpdate()
        }
        setLoading(false)
    }

    const handleDeleteCategory = async (catId: number) => {
        if (!confirm("¿Eliminar esta categoría y todos sus conceptos?")) return

        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase
            .from("presupuesto_categorias")
            .delete()
            .eq("id", catId)

        if (error) {
            console.error("Error deleting category:", error)
        } else {
            onUpdate()
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-800">Desglose de Costos</h3>
                <Button onClick={handleAddCategory} size="sm" variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Categoría
                </Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#02457A]/5 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 w-[40%]">Concepto</th>
                                <th className="px-2 py-3 w-[10%] text-center">Unidad</th>
                                <th className="px-2 py-3 w-[10%] text-center">Cant</th>
                                <th className="px-2 py-3 w-[12%] text-right bg-orange-50/50">Costo U.</th>
                                <th className="px-2 py-3 w-[12%] text-right bg-emerald-50/50">Venta U.</th>
                                <th className="px-2 py-3 w-[12%] text-right font-bold bg-emerald-50">Subtotal</th>
                                <th className="px-2 py-3 w-[4%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {categories.map((cat) => {
                                const isExpanded = expandedCategories[cat.id]
                                const items = localItems[cat.id] || []
                                const catSubtotal = items.reduce((sum, item) => sum + (item.cantidad * item.prec_venta_unitario), 0)

                                return (
                                    <>
                                        {/* Category Header Row */}
                                        <tr key={`cat-${cat.id}`} className="bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors">
                                            <td colSpan={5} className="px-4 py-2 font-semibold text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => toggleCategory(cat.id)} className="p-1 hover:bg-slate-200 rounded">
                                                        <ChevronDown className={cn("h-4 w-4 transition-transform", !isExpanded && "-rotate-90")} />
                                                    </button>
                                                    {cat.nombre}
                                                    <span className="text-xs font-normal text-slate-500 ml-2">({items.length} items)</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-right font-bold text-slate-800 bg-slate-100">
                                                ${catSubtotal.toLocaleString()}
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Items Rows */}
                                        {isExpanded && items.map((item) => (
                                            <tr key={item.id} className="group hover:bg-slate-50">
                                                <td className="px-4 py-1.5 align-middle border-l-4 border-transparent pl-8">
                                                    <Input
                                                        value={item.concepto}
                                                        onChange={(e) => handleLocalChange(item.id, 'concepto', e.target.value)}
                                                        onBlur={(e) => handleBlurItem(item.id, { concepto: e.target.value })}
                                                        className="h-8 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent px-2 text-sm"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5 align-middle">
                                                    <Input
                                                        value={item.unidad || ""}
                                                        onChange={(e) => handleLocalChange(item.id, 'unidad', e.target.value)}
                                                        onBlur={(e) => handleBlurItem(item.id, { unidad: e.target.value })}
                                                        className="h-8 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent text-center px-1 text-sm"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5 align-middle">
                                                    <Input
                                                        type="number"
                                                        value={item.cantidad}
                                                        onChange={(e) => handleLocalChange(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                                                        onBlur={(e) => handleBlurItem(item.id, { cantidad: parseFloat(e.target.value) || 0 })}
                                                        className="h-8 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent text-center px-1 font-medium text-slate-700 text-sm"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5 align-middle bg-orange-50/10 group-hover:bg-orange-50/30">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                                                        <Input
                                                            type="number"
                                                            value={item.costo_unitario}
                                                            onChange={(e) => handleLocalChange(item.id, 'costo_unitario', parseFloat(e.target.value) || 0)}
                                                            onBlur={(e) => handleBlurItem(item.id, { costo_unitario: parseFloat(e.target.value) || 0 })}
                                                            className="h-8 border-transparent hover:border-orange-300 focus:border-orange-500 bg-transparent text-right pl-5 pr-2 text-sm text-slate-600"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1.5 align-middle bg-emerald-50/10 group-hover:bg-emerald-50/30">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                                                        <Input
                                                            type="number"
                                                            value={item.prec_venta_unitario}
                                                            onChange={(e) => handleLocalChange(item.id, 'prec_venta_unitario', parseFloat(e.target.value) || 0)}
                                                            onBlur={(e) => handleBlurItem(item.id, { prec_venta_unitario: parseFloat(e.target.value) || 0 })}
                                                            className="h-8 border-transparent hover:border-emerald-300 focus:border-emerald-500 bg-transparent text-right pl-5 pr-2 font-medium text-emerald-700 text-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1.5 align-middle text-right font-bold text-slate-800 bg-emerald-50/20">
                                                    ${(item.cantidad * item.prec_venta_unitario).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-2 py-1.5 align-middle text-center">
                                                    <Button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Add Item Row per Category */}
                                        {isExpanded && (
                                            <tr className="bg-white">
                                                <td colSpan={7} className="px-4 py-2 border-b border-slate-100">
                                                    <Button
                                                        onClick={() => handleAddItem(cat.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 text-xs pl-8"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Agregar concepto a {cat.nombre}
                                                    </Button>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
