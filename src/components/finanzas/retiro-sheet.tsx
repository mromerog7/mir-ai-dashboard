"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Loader2, Wallet, AlertTriangle } from "lucide-react"
import { format } from "date-fns"

interface RetiroSheetProps {
    onSuccess: () => void
    initialData?: any
    retiroId?: number
    trigger?: React.ReactNode
}

const fmt = (v: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(v)

export function RetiroSheet({ onSuccess, initialData, retiroId, trigger }: RetiroSheetProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [monto, setMonto] = useState<string>(initialData?.monto?.toString() || "")
    const [fecha, setFecha] = useState<string>(initialData?.fecha || format(new Date(), "yyyy-MM-dd"))
    const [descripcion, setDescripcion] = useState<string>(initialData?.descripcion || "")
    const [saldo, setSaldo] = useState<number>(0)
    const [saldoLoading, setSaldoLoading] = useState(true)
    const [montoError, setMontoError] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        const fetchSaldo = async () => {
            setSaldoLoading(true)
            const supabase = createClient()
            const [ing, gasOp, ret, gasProy] = await Promise.all([
                supabase.from("finanzas_ingresos").select("monto"),
                supabase.from("finanzas_gastos_operacion").select("monto"),
                supabase.from("finanzas_retiros").select("id, monto"),
                supabase.from("gastos").select("monto"),
            ])
            const totalIng = (ing.data || []).reduce((s, r) => s + Number(r.monto), 0)
            const totalGasOp = (gasOp.data || []).reduce((s, r) => s + Number(r.monto), 0)
            // Exclude current retiro if editing
            const totalRet = (ret.data || []).filter(r => r.id !== retiroId).reduce((s, r) => s + Number(r.monto), 0)
            const totalGasProy = (gasProy.data || []).reduce((s, r) => s + Number(r.monto), 0)
            setSaldo(totalIng - totalGasOp - totalRet - totalGasProy)
            setSaldoLoading(false)
        }
        fetchSaldo()
    }, [open, retiroId])

    const handleMontoChange = (val: string) => {
        setMonto(val)
        const num = parseFloat(val)
        if (!isNaN(num) && num > saldo) {
            setMontoError(`El monto excede el saldo disponible (${fmt(saldo)})`)
        } else {
            setMontoError(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!monto || !fecha) return
        const num = parseFloat(monto)
        if (num > saldo) {
            setMontoError(`El monto excede el saldo disponible (${fmt(saldo)})`)
            return
        }
        setLoading(true)
        const supabase = createClient()
        const payload = { monto: parseFloat(monto), fecha, descripcion: descripcion || null }
        if (retiroId) {
            await supabase.from("finanzas_retiros").update(payload).eq("id", retiroId)
        } else {
            await supabase.from("finanzas_retiros").insert(payload)
        }
        setLoading(false)
        setOpen(false)
        onSuccess()
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ?? (
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1">
                        <Plus className="h-4 w-4" /> Nuevo Retiro
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-violet-700">{retiroId ? "Editar Retiro" : "Nuevo Retiro de Utilidades"}</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Saldo Disponible Banner */}
                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${saldoLoading ? "bg-slate-50 border-slate-200" : saldo > 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
                        <Wallet className={`h-5 w-5 ${saldo > 0 ? "text-blue-500" : "text-red-500"}`} />
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Saldo Disponible</p>
                            <p className={`text-lg font-black ${saldoLoading ? "text-slate-400" : saldo > 0 ? "text-blue-600" : "text-red-600"}`}>
                                {saldoLoading ? "Calculando..." : fmt(saldo)}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label>Monto *</Label>
                        <Input type="number" step="0.01" value={monto} onChange={e => handleMontoChange(e.target.value)} placeholder="0.00" className={`bg-slate-50 ${montoError ? "border-red-400" : ""}`} required />
                        {montoError && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" /> {montoError}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>Fecha *</Label>
                        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="bg-slate-50" required />
                    </div>
                    <div className="space-y-1">
                        <Label>Descripción</Label>
                        <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Opcional..." className="bg-slate-50 resize-none" rows={3} />
                    </div>
                    <Button type="submit" disabled={loading || !!montoError || saldoLoading} className="w-full bg-violet-600 hover:bg-violet-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {retiroId ? "Actualizar" : "Guardar Retiro"}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    )
}
