"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Pencil, Save, Loader2, Sparkles, Plus, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Minuta } from "@/types"
import { format } from "date-fns"

const formSchema = z.object({
    proyecto_id: z.coerce.number().optional(),
    fecha: z.string().min(1, "Fecha requerida"),
    titulo: z.string().min(1, "Título requerido"),
    participantes: z.string().optional(),
    puntos_tratados: z.string().optional(),
    acuerdos: z.string().optional(),
    pendientes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface MinutaDetailSheetProps {
    minuta?: Minuta
    trigger?: React.ReactNode
    defaultProjectId?: number
}

export function MinutaDetailSheet({ minuta, trigger, defaultProjectId }: MinutaDetailSheetProps) {
    const isEditing = !!minuta
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [projects, setProjects] = useState<{ id: number; nombre: string }[]>([])
    const router = useRouter()

    // AI State
    const [aiImproving, setAiImproving] = useState(false)
    const [aiField, setAiField] = useState<string | null>(null)

    const handleImproveText = async (currentText: string, onChange: (value: string) => void, fieldName: string) => {
        if (!currentText) return;

        setAiImproving(true);
        setAiField(fieldName);
        try {
            const payload = {
                tipo: "Minuta",
                instruccion: "mejora la redaccion, corrige ortografía y estructura los puntos clave de manera profesional usando markdown si es necesario",
                texto: currentText
            };

            const response = await fetch('https://n8n.grupocilar.com/webhook/mejorar-texto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Error connecting to AI service");

            const data = await response.json();
            if (data && data.output) {
                onChange(data.output);
            } else if (data && data.text) {
                onChange(data.text);
            }

        } catch (error) {
            console.error("AI Improvement Error:", error);
            alert("No se pudo mejorar el texto.");
        } finally {
            setAiImproving(false);
            setAiField(null);
        }
    };

    useEffect(() => {
        if (open) {
            const fetchProjects = async () => {
                const supabase = createClient()
                const { data } = await supabase
                    .from("proyectos")
                    .select("id, nombre")
                    // .eq("status", "En Progreso") // Fetch all for now to show history
                    .order("nombre")
                if (data) setProjects(data)
            }
            fetchProjects()
        }
    }, [open])

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            proyecto_id: minuta?.proyecto_id || defaultProjectId || undefined,
            fecha: minuta?.fecha ? minuta.fecha.split('T')[0] : format(new Date(), "yyyy-MM-dd"),
            titulo: minuta?.titulo || "",
            participantes: minuta?.participantes || "",
            puntos_tratados: minuta?.puntos_tratados || "",
            acuerdos: minuta?.acuerdos || "",
            pendientes: minuta?.pendientes || "",
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                proyecto_id: minuta?.proyecto_id || defaultProjectId || undefined,
                fecha: minuta?.fecha ? minuta.fecha.split('T')[0] : format(new Date(), "yyyy-MM-dd"),
                titulo: minuta?.titulo || "",
                participantes: minuta?.participantes || "",
                puntos_tratados: minuta?.puntos_tratados || "",
                acuerdos: minuta?.acuerdos || "",
                pendientes: minuta?.pendientes || "",
            })
        }
    }, [open, minuta, defaultProjectId, form])

    async function onSubmit(data: FormValues) {
        setSaving(true)
        try {
            const supabase = createClient()

            const payload = {
                ...data,
                proyecto_id: data.proyecto_id === 0 ? null : data.proyecto_id
            }

            if (isEditing && minuta) {
                const { error } = await supabase
                    .from("minutas")
                    .update(payload)
                    .eq("id", minuta.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from("minutas")
                    .insert(payload)
                if (error) throw error
            }

            setOpen(false)
            router.refresh()
        } catch (error: any) {
            console.error("Error saving minuta:", error)
            alert(`Error: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-white">
                        {isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-slate-900 border-slate-800 text-white overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-white">
                        {isEditing ? "Editar Minuta" : "Nueva Minuta"}
                    </SheetTitle>
                    <SheetDescription className="text-slate-400">
                        Registro de acuerdos y puntos clave de la reunión.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fecha"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-slate-800 border-slate-700 block w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="proyecto_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proyecto (Opcional)</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            value={field.value?.toString() || "0"}
                                            defaultValue={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                <SelectItem value="0">General / Sin Proyecto</SelectItem>
                                                {projects.map((project) => (
                                                    <SelectItem key={project.id} value={project.id.toString()}>
                                                        {project.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="titulo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título / Objetivo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Revisión Semanal de Avances" {...field} className="bg-slate-800 border-slate-700" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="participantes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Participantes</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombres de los asistentes..." {...field} className="bg-slate-800 border-slate-700" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Text Areas with AI */}
                        {[
                            { name: "puntos_tratados", label: "Puntos Tratados" },
                            { name: "acuerdos", label: "Acuerdos" },
                            { name: "pendientes", label: "Pendientes Siguiente Reunión" }
                        ].map((item) => (
                            <FormField
                                key={item.name}
                                control={form.control}
                                name={item.name as any}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{item.label}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={`Detalle de ${item.label.toLowerCase()}...`}
                                                {...field}
                                                className="bg-slate-800 border-slate-700 min-h-[100px]"
                                            />
                                        </FormControl>
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleImproveText(field.value, field.onChange, item.name)}
                                                disabled={!field.value || aiImproving}
                                                className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 h-6 text-xs"
                                            >
                                                {aiImproving && aiField === item.name ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                )}
                                                Mejorar con IA
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="hover:bg-slate-800">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Guardar Cambios" : "Crear Minuta"}
                            </Button>
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
