"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BalanceDashboard } from "@/components/finanzas/balance-dashboard"
import { IngresoSheet } from "@/components/finanzas/ingreso-sheet"
import { GastoOpSheet } from "@/components/finanzas/gasto-op-sheet"
import { RetiroSheet } from "@/components/finanzas/retiro-sheet"
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Wallet, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface FinanzasViewProps {
    initialIngresos: any[]
    initialGastosOp: any[]
    initialRetiros: any[]
    projects: any[]
}

const fmt = (v: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(v)

const fmtDate = (d: string) => {
    try { return format(new Date(d + "T00:00:00"), "d MMM yyyy", { locale: es }) } catch { return d }
}

const TIPO_COLOR: Record<string, string> = {
    Anticipo: "bg-sky-100 text-sky-700",
    Abono: "bg-emerald-100 text-emerald-700",
    "Liquidación": "bg-blue-100 text-blue-700",
    Otro: "bg-slate-100 text-slate-700",
}
const CAT_COLOR: Record<string, string> = {
    Salarios: "bg-amber-100 text-amber-700",
    Renta: "bg-orange-100 text-orange-700",
    Internet: "bg-cyan-100 text-cyan-700",
    Servicios: "bg-teal-100 text-teal-700",
    Marketing: "bg-pink-100 text-pink-700",
    Equipo: "bg-indigo-100 text-indigo-700",
    Otro: "bg-slate-100 text-slate-700",
}

export function FinanzasView({ initialIngresos, initialGastosOp, initialRetiros, projects }: FinanzasViewProps) {
    const [ingresos, setIngresos] = useState(initialIngresos)
    const [gastosOp, setGastosOp] = useState(initialGastosOp)
    const [retiros, setRetiros] = useState(initialRetiros)

    const reload = useCallback(async () => {
        const supabase = createClient()
        const [ing, gas, ret] = await Promise.all([
            supabase.from("finanzas_ingresos").select("*, proyectos(nombre)").order("fecha", { ascending: false }),
            supabase.from("finanzas_gastos_operacion").select("*").order("fecha", { ascending: false }),
            supabase.from("finanzas_retiros").select("*").order("fecha", { ascending: false }),
        ])
        if (ing.data) setIngresos(ing.data)
        if (gas.data) setGastosOp(gas.data)
        if (ret.data) setRetiros(ret.data)
    }, [])

    const deleteIngreso = async (id: number) => {
        if (!confirm("¿Eliminar este ingreso?")) return
        await createClient().from("finanzas_ingresos").delete().eq("id", id)
        reload()
    }
    const deleteGastoOp = async (id: number) => {
        if (!confirm("¿Eliminar este gasto?")) return
        await createClient().from("finanzas_gastos_operacion").delete().eq("id", id)
        reload()
    }
    const deleteRetiro = async (id: number) => {
        if (!confirm("¿Eliminar este retiro?")) return
        await createClient().from("finanzas_retiros").delete().eq("id", id)
        reload()
    }

    const totalIngresos = ingresos.reduce((s: number, r: any) => s + Number(r.monto), 0)
    const totalGastosOp = gastosOp.reduce((s: number, r: any) => s + Number(r.monto), 0)
    const totalRetiros = retiros.reduce((s: number, r: any) => s + Number(r.monto), 0)

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#02457A] flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                        Finanzas
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Balance financiero general de la empresa</p>
                </div>
            </div>

            <Tabs defaultValue="balance" className="w-full">
                <TabsList className="grid grid-cols-4 w-full max-w-xl bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger value="balance" className="data-[state=active]:bg-white data-[state=active]:text-[#02457A] data-[state=active]:shadow-sm rounded-md">Balance</TabsTrigger>
                    <TabsTrigger value="ingresos" className="data-[state=active]:bg-white data-[state=active]:text-[#02457A] data-[state=active]:shadow-sm rounded-md">
                        Ingresos <span className="ml-1 text-xs opacity-70">({ingresos.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="gastos" className="data-[state=active]:bg-white data-[state=active]:text-[#02457A] data-[state=active]:shadow-sm rounded-md">
                        Gastos Op. <span className="ml-1 text-xs opacity-70">({gastosOp.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="retiros" className="data-[state=active]:bg-white data-[state=active]:text-[#02457A] data-[state=active]:shadow-sm rounded-md">
                        Retiros <span className="ml-1 text-xs opacity-70">({retiros.length})</span>
                    </TabsTrigger>
                </TabsList>

                {/* BALANCE GENERAL */}
                <TabsContent value="balance" className="mt-6">
                    <BalanceDashboard ingresos={ingresos} gastosOp={gastosOp} retiros={retiros} />
                </TabsContent>

                {/* INGRESOS */}
                <TabsContent value="ingresos" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm text-slate-500">Total registrado:</span>
                            <span className="ml-2 text-lg font-bold text-emerald-600">{fmt(totalIngresos)}</span>
                        </div>
                        <IngresoSheet projects={projects} onSuccess={reload} />
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descripción</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ingresos.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-400 italic">Sin ingresos registrados.</td></tr>
                                ) : ingresos.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-slate-600">{fmtDate(r.fecha)}</td>
                                        <td className="px-4 py-3"><Badge className={`${TIPO_COLOR[r.tipo] || "bg-slate-100 text-slate-700"} border-0 text-xs`}>{r.tipo}</Badge></td>
                                        <td className="px-4 py-3 text-slate-600">{r.proyectos?.nombre || <span className="text-slate-400 italic">General</span>}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.descripcion || "—"}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">{fmt(r.monto)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 justify-end">
                                                <IngresoSheet projects={projects} onSuccess={reload} initialData={{ ...r, proyecto_id: r.proyecto_id }} ingresoId={r.id} trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>} />
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => deleteIngreso(r.id)}><Trash2 className="h-3 w-3" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                {/* GASTOS OPERACIÓN */}
                <TabsContent value="gastos" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm text-slate-500">Total registrado:</span>
                            <span className="ml-2 text-lg font-bold text-rose-600">{fmt(totalGastosOp)}</span>
                        </div>
                        <GastoOpSheet onSuccess={reload} />
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Categoría</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descripción</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {gastosOp.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-400 italic">Sin gastos de operación registrados.</td></tr>
                                ) : gastosOp.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-slate-600">{fmtDate(r.fecha)}</td>
                                        <td className="px-4 py-3"><Badge className={`${CAT_COLOR[r.categoria] || "bg-slate-100 text-slate-700"} border-0 text-xs`}>{r.categoria}</Badge></td>
                                        <td className="px-4 py-3 font-medium text-slate-700">{r.concepto}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.descripcion || "—"}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-rose-600">{fmt(r.monto)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 justify-end">
                                                <GastoOpSheet onSuccess={reload} initialData={r} gastoId={r.id} trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>} />
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => deleteGastoOp(r.id)}><Trash2 className="h-3 w-3" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                {/* RETIROS */}
                <TabsContent value="retiros" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm text-slate-500">Total retirado:</span>
                            <span className="ml-2 text-lg font-bold text-violet-600">{fmt(totalRetiros)}</span>
                        </div>
                        <RetiroSheet onSuccess={reload} />
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descripción</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {retiros.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-10 text-slate-400 italic">Sin retiros registrados.</td></tr>
                                ) : retiros.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-slate-600">{fmtDate(r.fecha)}</td>
                                        <td className="px-4 py-3 text-slate-500">{r.descripcion || "—"}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-violet-600">{fmt(r.monto)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 justify-end">
                                                <RetiroSheet onSuccess={reload} initialData={r} retiroId={r.id} trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>} />
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => deleteRetiro(r.id)}><Trash2 className="h-3 w-3" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
