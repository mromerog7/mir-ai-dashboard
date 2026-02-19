"use client"

import { useState, useEffect } from "react"
import { Budget, BudgetCategory } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"

interface BudgetSummaryProps {
    budget: Budget
    categories: BudgetCategory[]
    onUpdate: () => void
}

export function BudgetSummary({ budget, categories, onUpdate }: BudgetSummaryProps) {
    const [loading, setLoading] = useState(false)
    const [honorariosType, setHonorariosType] = useState<"Porcentaje" | "Fijo" | "Mixto">(budget.tipo_honorarios || "Porcentaje")
    const [honorariosPerc, setHonorariosPerc] = useState(budget.honorarios_porcentaje || 0)
    const [honorariosFixed, setHonorariosFixed] = useState(budget.honorarios_monto_fijo || 0)
    const [indirectosPerc, setIndirectosPerc] = useState(budget.indirectos_porcentaje || 0)
    const [ivaPerc, setIvaPerc] = useState(budget.iva_porcentaje || 0.16)

    // Calculate totals from items
    const calculateTotals = () => {
        let totalCostoDirecto = 0
        let totalVentaDirecta = 0

        categories.forEach(cat => {
            if (cat.items) {
                cat.items.forEach(item => {
                    const cant = Number(item.cantidad) || 0
                    const costo = Number(item.costo_unitario) || 0
                    const venta = Number(item.prec_venta_unitario) || 0

                    totalCostoDirecto += cant * costo
                    totalVentaDirecta += cant * venta
                })
            }
        })

        return { totalCostoDirecto, totalVentaDirecta }
    }

    const { totalCostoDirecto, totalVentaDirecta } = calculateTotals()

    // Calculate Indirectos
    const indirectosMonto = totalVentaDirecta * (indirectosPerc / 100)

    const subtotal = totalVentaDirecta + indirectosMonto
    const ivaMonto = subtotal * ivaPerc
    const totalFinal = subtotal + ivaMonto

    // Margen Bruto
    const margenBruto = totalFinal - ivaMonto - totalCostoDirecto // Simplified: Selling Price (pre-tax) - Cost
    // More accurate margin: (Total Revenue - Total Direct Cost)
    // Revenue = Subtotal (Includes Markups)
    // Cost = totalCostoDirecto
    const realRevenue = subtotal
    const realMagin = realRevenue - totalCostoDirecto
    const marginPerc = realRevenue > 0 ? (realMagin / realRevenue) * 100 : 0

    // Save configuration
    const handleSaveConfig = async () => {
        setLoading(true)
        const supabase = createClient()

        const { error } = await supabase
            .from("presupuestos")
            .update({
                honorarios_porcentaje: 0,
                honorarios_monto_fijo: 0,
                indirectos_porcentaje: indirectosPerc,
                iva_porcentaje: ivaPerc,
                total_costo_directo: totalCostoDirecto,
                total_venta_directa: totalVentaDirecta,
                total_final: totalFinal
            })
            .eq("id", budget.id)

        if (error) {
            console.error("Error saving budget config:", error)
        } else {
            onUpdate() // Refresh
        }
        setLoading(false)
    }

    return (
        <Card className="h-fit sticky top-4 border-slate-200 shadow-sm bg-slate-50/50">
            <CardHeader className="pb-3 border-b border-slate-200 bg-white rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <span className="text-xl">🧮</span>
                    Resumen Financiero
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
                {/* Costos Directos */}
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Costo Directo (Real)</span>
                        <span className="font-medium text-slate-700">${totalCostoDirecto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Venta Directa (Base)</span>
                        <span className="font-medium text-slate-900">${totalVentaDirecta.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>

                <Separator />


                {/* Config: Indirectos */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Indirectos / Gestión</Label>
                    <div className="flex gap-2 items-center">
                        <div className="w-20 relative">
                            <Input
                                type="number"
                                value={indirectosPerc}
                                onChange={(e) => setIndirectosPerc(parseFloat(e.target.value) || 0)}
                                className="h-8 bg-white pr-6 text-right"
                            />
                            <span className="absolute right-2 top-2 text-xs text-slate-400">%</span>
                        </div>
                        <div className="flex-1 text-right text-sm font-medium text-slate-600">
                            + ${indirectosMonto.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>

                <Separator className="bg-slate-300" />

                {/* Totals */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-medium text-slate-600">Subtotal</span>
                        <span className="text-lg font-bold text-slate-800">${subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">IVA</span>
                            <div className="w-14 relative h-6">
                                <Input
                                    type="number"
                                    value={ivaPerc * 100}
                                    onChange={(e) => setIvaPerc((parseFloat(e.target.value) || 0) / 100)}
                                    className="h-6 w-14 p-0 text-center text-xs bg-transparent border-slate-200"
                                />
                                <span className="absolute -right-2 top-1 opacity-0 pointer-events-none">%</span>
                            </div>
                        </div>
                        <span className="text-slate-600">+ ${ivaMonto.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-base font-bold text-[#02457A]">TOTAL CLIENTE</span>
                        <span className="text-xl font-black text-[#02457A]">${totalFinal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Margin Analysis */}
                <div className="mt-4 pt-4 border-t border-slate-200 bg-emerald-50/50 -mx-6 px-6 pb-2">
                    <div className="flex justify-between items-center text-emerald-800">
                        <span className="text-xs font-bold uppercase tracking-wider">Margen Bruto</span>
                        <div className="text-right">
                            <div className="text-sm font-bold">${realMagin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="text-xs opacity-80">{marginPerc.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSaveConfig}
                    className="w-full bg-[#02457A] hover:bg-[#002a4d] shadow-md"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Configuración
                </Button>
            </CardContent>
        </Card>
    )
}
