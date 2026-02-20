"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface GastoOpSheetProps {
    onSuccess: () => void
    initialData?: any
    gastoId?: number
    trigger?: React.ReactNode
}

const CATEGORIAS = ["Salarios", "Renta", "Internet", "Servicios", "Marketing", "Equipo", "Otro"] as const

export function GastoOpSheet({ onSuccess, initialData, gastoId, trigger }: GastoOpSheetProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categoria, setCategoria] = useState<string>(initialData?.categoria || "Salarios")
    const [concepto, setConcepto] = useState<string>(initialData?.concepto || "")
    const [monto, setMonto] = useState<string>(initialData?.monto?.toString() || "")
    const [fecha, setFecha] = useState<string>(initialData?.fecha || format(new Date(), "yyyy-MM-dd"))
    const [descripcion, setDescripcion] = useState<string>(initialData?.descripcion || "")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!monto || !categoria || !concepto || !fecha) return
        setLoading(true)
        const supabase = createClient()
        const payload = { categoria, concepto, monto: parseFloat(monto), fecha, descripcion: descripcion || null }
        if (gastoId) {
            await supabase.from("finanzas_gastos_operacion").update(payload).eq("id", gastoId)
        } else {
            await supabase.from("finanzas_gastos_operacion").insert(payload)
        }
        setLoading(false)
        setOpen(false)
        onSuccess()
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ?? (
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white gap-1">
                        <Plus className="h-4 w-4" /> Nuevo Gasto Op.
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-rose-700">{gastoId ? "Editar Gasto" : "Nuevo Gasto de Operación"}</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label>Categoría *</Label>
                        <Select value={categoria} onValueChange={setCategoria}>
                            <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>Concepto *</Label>
                        <Input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej. Salario desarrollador" className="bg-slate-50" required />
                    </div>
                    <div className="space-y-1">
                        <Label>Monto *</Label>
                        <Input type="number" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="bg-slate-50" required />
                    </div>
                    <div className="space-y-1">
                        <Label>Fecha *</Label>
                        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="bg-slate-50" required />
                    </div>
                    <div className="space-y-1">
                        <Label>Descripción</Label>
                        <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Opcional..." className="bg-slate-50 resize-none" rows={3} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-rose-600 hover:bg-rose-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {gastoId ? "Actualizar" : "Guardar Gasto"}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    )
}
