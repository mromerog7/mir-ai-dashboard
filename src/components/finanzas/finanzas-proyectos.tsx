"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FinanzasProyectosProps {
    projects: any[]
    ingresos: any[]
}

const fmt = (v: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)

export function FinanzasProyectos({ projects, ingresos }: FinanzasProyectosProps) {
    const [gastos, setGastos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from("gastos")
                .select("id, proyecto_id, monto")
            setGastos(data || [])
            setLoading(false)
        }
        fetch()
    }, [])

    const rows = useMemo(() => {
        return projects.map(p => {
            const projIngresos = ingresos.filter((i: any) => i.proyecto_id === p.id)
            const anticipos = projIngresos.filter((i: any) => i.tipo === "Anticipo").reduce((s: number, i: any) => s + Number(i.monto), 0)
            const abonos = projIngresos.filter((i: any) => i.tipo === "Abono").reduce((s: number, i: any) => s + Number(i.monto), 0)
            const liquidacion = projIngresos.filter((i: any) => i.tipo === "Liquidación").reduce((s: number, i: any) => s + Number(i.monto), 0)
            const otrosIng = projIngresos.filter((i: any) => i.tipo === "Otro").reduce((s: number, i: any) => s + Number(i.monto), 0)
            const totalIngresos = anticipos + abonos + liquidacion + otrosIng

            const costoReal = gastos.filter(g => g.proyecto_id === p.id).reduce((s: number, g: any) => s + Number(g.monto), 0)
            const utilidad = totalIngresos - costoReal
            const utilidadPct = totalIngresos > 0 ? (utilidad / totalIngresos) * 100 : 0

            return { ...p, anticipos, abonos, liquidacion, totalIngresos, costoReal, utilidad, utilidadPct }
        })
    }, [projects, ingresos, gastos])

    if (loading) {
        return <div className="text-center py-12 text-slate-400">Cargando datos de proyectos...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#02457A]" />
                <span className="text-sm font-semibold text-slate-700">Resumen financiero por proyecto</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50">Proyecto</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold text-sky-600 uppercase">Anticipos</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold text-emerald-600 uppercase">Abonos</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold text-blue-600 uppercase">Liquidación</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold text-slate-700 uppercase bg-slate-100">Total Ingresos</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold text-rose-600 uppercase">Costo Real</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold text-slate-700 uppercase bg-slate-100">Utilidad</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase">%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-10 text-slate-400 italic">Sin proyectos</td></tr>
                        ) : rows.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-800 sticky left-0 bg-white">{r.nombre}</td>
                                <td className="px-3 py-3 text-right text-sky-600">{r.anticipos > 0 ? fmt(r.anticipos) : <span className="text-slate-300">—</span>}</td>
                                <td className="px-3 py-3 text-right text-emerald-600">{r.abonos > 0 ? fmt(r.abonos) : <span className="text-slate-300">—</span>}</td>
                                <td className="px-3 py-3 text-right text-blue-600">{r.liquidacion > 0 ? fmt(r.liquidacion) : <span className="text-slate-300">—</span>}</td>
                                <td className="px-3 py-3 text-right font-bold text-slate-800 bg-slate-50">{fmt(r.totalIngresos)}</td>
                                <td className="px-3 py-3 text-right font-semibold text-rose-600">{r.costoReal > 0 ? fmt(r.costoReal) : <span className="text-slate-300">—</span>}</td>
                                <td className={`px-3 py-3 text-right font-bold bg-slate-50 ${r.utilidad >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(r.utilidad)}</td>
                                <td className="px-3 py-3 text-right">
                                    <Badge className={`border-0 text-xs ${r.utilidad >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                        {r.utilidadPct.toFixed(1)}%
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {rows.length > 0 && (
                        <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                            <tr className="font-bold text-sm">
                                <td className="px-4 py-3 text-slate-700 sticky left-0 bg-slate-100">TOTALES</td>
                                <td className="px-3 py-3 text-right text-sky-700">{fmt(rows.reduce((s, r) => s + r.anticipos, 0))}</td>
                                <td className="px-3 py-3 text-right text-emerald-700">{fmt(rows.reduce((s, r) => s + r.abonos, 0))}</td>
                                <td className="px-3 py-3 text-right text-blue-700">{fmt(rows.reduce((s, r) => s + r.liquidacion, 0))}</td>
                                <td className="px-3 py-3 text-right text-slate-900">{fmt(rows.reduce((s, r) => s + r.totalIngresos, 0))}</td>
                                <td className="px-3 py-3 text-right text-rose-700">{fmt(rows.reduce((s, r) => s + r.costoReal, 0))}</td>
                                <td className={`px-3 py-3 text-right ${rows.reduce((s, r) => s + r.utilidad, 0) >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmt(rows.reduce((s, r) => s + r.utilidad, 0))}</td>
                                <td className="px-3 py-3"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    )
}
