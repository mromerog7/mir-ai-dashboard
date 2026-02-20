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

interface Project { id: number; nombre: string }
interface IngresoSheetProps {
    projects: Project[]
    onSuccess: () => void
    initialData?: any
    ingresoId?: number
    trigger?: React.ReactNode
}

const TIPOS = ["Anticipo", "Abono", "Liquidación", "Otro"] as const

export function IngresoSheet({ projects, onSuccess, initialData, ingresoId, trigger }: IngresoSheetProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [proyectoId, setProyectoId] = useState<string>(initialData?.proyecto_id?.toString() || "__none__")
    const [tipo, setTipo] = useState<string>(initialData?.tipo || "Anticipo")
    const [monto, setMonto] = useState<string>(initialData?.monto?.toString() || "")
    const [fecha, setFecha] = useState<string>(initialData?.fecha || format(new Date(), "yyyy-MM-dd"))
    const [descripcion, setDescripcion] = useState<string>(initialData?.descripcion || "")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!monto || !tipo || !fecha) return
        setLoading(true)
        const supabase = createClient()
        const payload = {
            proyecto_id: proyectoId && proyectoId !== "__none__" ? parseInt(proyectoId) : null,
            tipo,
            monto: parseFloat(monto),
            fecha,
            descripcion: descripcion || null,
        }
        if (ingresoId) {
            await supabase.from("finanzas_ingresos").update(payload).eq("id", ingresoId)
        } else {
            await supabase.from("finanzas_ingresos").insert(payload)
        }
        setLoading(false)
        setOpen(false)
        onSuccess()
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ?? (
                    <Button size="sm" className="bg-[#02457A] hover:bg-[#002a4d] text-white gap-1">
                        <Plus className="h-4 w-4" /> Nuevo Ingreso
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-[#02457A]">{ingresoId ? "Editar Ingreso" : "Nuevo Ingreso"}</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label>Proyecto (opcional)</Label>
                        <Select value={proyectoId} onValueChange={setProyectoId}>
                            <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Sin proyecto..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Sin proyecto</SelectItem>
                                {projects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>Tipo *</Label>
                        <Select value={tipo} onValueChange={setTipo}>
                            <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
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
                    <Button type="submit" disabled={loading} className="w-full bg-[#02457A] hover:bg-[#002a4d]">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {ingresoId ? "Actualizar" : "Guardar Ingreso"}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    )
}
