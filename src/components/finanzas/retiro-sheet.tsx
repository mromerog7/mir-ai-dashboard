"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface RetiroSheetProps {
    onSuccess: () => void
    initialData?: any
    retiroId?: number
    trigger?: React.ReactNode
}

export function RetiroSheet({ onSuccess, initialData, retiroId, trigger }: RetiroSheetProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [monto, setMonto] = useState<string>(initialData?.monto?.toString() || "")
    const [fecha, setFecha] = useState<string>(initialData?.fecha || format(new Date(), "yyyy-MM-dd"))
    const [descripcion, setDescripcion] = useState<string>(initialData?.descripcion || "")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!monto || !fecha) return
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
                    <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {retiroId ? "Actualizar" : "Guardar Retiro"}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    )
}
