"use client"

import { useMemo, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TrendingUp, TrendingDown, DollarSign, ArrowDownLeft, ArrowUpRight, Wallet, Clock, Receipt } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

interface BalanceDashboardProps {
    ingresos: any[]
    gastosOp: any[]
    retiros: any[]
}

const fmt = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)

export function BalanceDashboard({ ingresos, gastosOp, retiros }: BalanceDashboardProps) {
    const [gastosProyectos, setGastosProyectos] = useState<any[]>([])
    const [presupuestos, setPresupuestos] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const [g, p] = await Promise.all([
                supabase.from("gastos").select("id, proyecto_id, monto"),
                supabase.from("presupuestos").select("id, proyecto_id, total_final"),
            ])
            setGastosProyectos(g.data || [])
            setPresupuestos(p.data || [])
        }
        fetchData()
    }, [])

    const totalIngresos = ingresos.reduce((s, r) => s + Number(r.monto), 0)
    const totalGastosOp = gastosOp.reduce((s, r) => s + Number(r.monto), 0)
    const totalRetiros = retiros.reduce((s, r) => s + Number(r.monto), 0)
    const totalGastosRealesProyectos = gastosProyectos.reduce((s, r) => s + Number(r.monto), 0)
    const saldo = totalIngresos - totalGastosOp - totalRetiros - totalGastosRealesProyectos

    // Pendiente por Ingresar = sum of (totalCliente - anticipos - abonos - liquidacion) per project
    const pendientePorIngresar = useMemo(() => {
        const projectIds = [...new Set(presupuestos.map(p => p.proyecto_id))]
        return projectIds.reduce((total, pid) => {
            const totalCliente = presupuestos.filter(p => p.proyecto_id === pid).reduce((s, p) => s + Number(p.total_final || 0), 0)
            const projIngresos = ingresos.filter((i: any) => i.proyecto_id === pid)
            const anticipos = projIngresos.filter((i: any) => i.tipo === "Anticipo").reduce((s: number, i: any) => s + Number(i.monto), 0)
            const abonos = projIngresos.filter((i: any) => i.tipo === "Abono").reduce((s: number, i: any) => s + Number(i.monto), 0)
            const liquidacion = projIngresos.filter((i: any) => i.tipo === "Liquidación").reduce((s: number, i: any) => s + Number(i.monto), 0)
            const restante = totalCliente - anticipos - abonos - liquidacion
            return total + (restante > 0 ? restante : 0)
        }, 0)
    }, [presupuestos, ingresos])

    // Last 6 months chart data
    const monthlyData = useMemo(() => {
        return Array.from({ length: 6 }, (_, i) => {
            const d = subMonths(new Date(), 5 - i)
            const start = startOfMonth(d).toISOString().split("T")[0]
            const end = endOfMonth(d).toISOString().split("T")[0]
            const label = format(d, "MMM", { locale: es })

            const ing = ingresos.filter(r => r.fecha >= start && r.fecha <= end).reduce((s, r) => s + Number(r.monto), 0)
            const gas = gastosOp.filter(r => r.fecha >= start && r.fecha <= end).reduce((s, r) => s + Number(r.monto), 0)
            const ret = retiros.filter(r => r.fecha >= start && r.fecha <= end).reduce((s, r) => s + Number(r.monto), 0)

            return { mes: label, Ingresos: ing, "Gastos Op.": gas, Retiros: ret }
        })
    }, [ingresos, gastosOp, retiros])

    const kpis = [
        { label: "Total Ingresos", value: totalIngresos, icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
        { label: "Gastos Operación", value: totalGastosOp, icon: ArrowDownLeft, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
        { label: "Gastos Reales Proy.", value: totalGastosRealesProyectos, icon: Receipt, color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
        { label: "Retiro Utilidades", value: totalRetiros, icon: Wallet, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
        { label: "Pendiente por Ingresar", value: pendientePorIngresar, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
        { label: "Saldo Disponible", value: saldo, icon: saldo >= 0 ? TrendingUp : TrendingDown, color: saldo >= 0 ? "text-blue-600" : "text-red-600", bg: saldo >= 0 ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100" },
    ]

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map(k => (
                    <div key={k.label} className={`p-4 rounded-xl border ${k.bg}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</span>
                            <k.icon className={`h-4 w-4 ${k.color}`} />
                        </div>
                        <div className={`text-xl font-black ${k.color}`}>{fmt(k.value)}</div>
                    </div>
                ))}
            </div>

            {/* Monthly Bar Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Movimientos Mensuales (últimos 6 meses)
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Gastos Op." fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Retiros" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
