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
import { Pencil, Loader2, Sparkles, Plus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Minuta } from "@/types"
import { format } from "date-fns"

// Helper Component for Dynamic List Input
function ListInput({ value = "", onChange, placeholder, aiEnabled, onAiImprove, isAiImproving, aiField, name, readonly }: any) {
    const separator = "\n\n"
    const [items, setItems] = useState<string[]>(value ? value.split(separator) : (readonly ? [] : [""]))

    useEffect(() => {
        setItems(value ? value.split(separator) : (readonly ? [] : [""]))
    }, [value, readonly])

    const updateParent = (newItems: string[]) => {
        onChange(newItems.join(separator))
    }

    const handleChange = (index: number, val: string) => {
        const newItems = [...items]
        newItems[index] = val
        setItems(newItems)
        updateParent(newItems)
    }

    const handleAdd = () => {
        const newItems = [...items, ""]
        setItems(newItems)
        updateParent(newItems)
    }

    const handleRemove = (index: number) => {
        const newItems = items.filter((_, i) => i !== index)
        const finalItems = newItems.length ? newItems : (readonly ? [] : [""])
        setItems(finalItems)
        updateParent(finalItems)
    }

    if (readonly && items.length === 0) {
        return <div className="text-slate-500 text-sm italic">Sin información</div>
    }

    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                <div key={index} className="flex gap-2 group items-start">
                    <span className="text-sm text-slate-500 w-6 text-right font-mono pt-3">{index + 1}.</span>
                    <div className="flex-1 relative">
                        <Textarea
                            value={item}
                            onChange={(e) => handleChange(index, e.target.value)}
                            placeholder={placeholder}
                            disabled={readonly}
                            className={`bg-white border-slate-200 text-black min-h-[80px] resize-y ${readonly ? "opacity-100 bg-transparent border-none px-0 resize-none min-h-0 font-medium" : ""}`}
                        />
                    </div>
                    {!readonly && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(index)}
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-slate-100 opacity-50 group-hover:opacity-100 transition-opacity mt-1"
                            title="Eliminar punto"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ))}
            {!readonly && (
                <div className="flex justify-between items-center pl-8 pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAdd}
                        className="border border-dashed border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300"
                    >
                        <Plus className="h-3 w-3 mr-2" />
                        Agregar
                    </Button>

                    {aiEnabled && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onAiImprove(value)}
                            disabled={!value || isAiImproving}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-7 text-xs"
                        >
                            {isAiImproving && aiField === name ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                                <Sparkles className="h-3 w-3 mr-1" />
                            )}
                            Mejorar Lista con IA
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

const formSchema = z.object({
    proyecto_id: z.coerce.number().optional(),
    fecha: z.string().min(1, "Fecha requerida"),
    titulo: z.string().min(1, "Título requerido"),
    participantes: z.string().optional(),
    puntos_tratados: z.string().optional(),
    acuerdos: z.string().optional(),
    pendientes: z.string().optional(),
    siguiente_reunion: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface MinutaDetailSheetProps {
    minuta?: Minuta
    trigger?: React.ReactNode
    defaultProjectId?: number
    readonly?: boolean
}

export function MinutaDetailSheet({ minuta, trigger, defaultProjectId, readonly = false }: MinutaDetailSheetProps) {
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
                instruccion: "mejora la redacción, corrige ortografía. Si es una lista, mantén cada punto en una línea separada. NO uses viñetas, guiones ni números al inicio de cada línea, solo el texto limpio. NO uses markdown.",
                texto: currentText
            };

            const response = await fetch('https://n8n.grupocilar.com/webhook/mejorar-texto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Error connecting to AI service");

            const data = await response.json();
            let improvedText = "";
            if (data && data.output) {
                improvedText = data.output;
            } else if (data && data.text) {
                improvedText = data.text;
            }

            if (improvedText) {
                // Remove potential markdown bullets if AI ignores instruction
                const cleanText = improvedText.split('\n').map((line: string) =>
                    line.replace(/^[-*•\d\.]+\s+/, '').trim()
                ).join('\n');
                onChange(cleanText);
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
            siguiente_reunion: minuta?.siguiente_reunion || "",
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
                siguiente_reunion: minuta?.siguiente_reunion || "",
            })
        }
    }, [open, minuta, defaultProjectId, form])

    async function onSubmit(data: FormValues) {
        if (readonly) return;
        setSaving(true)
        try {
            const supabase = createClient()

            const payload = {
                ...data,
                proyecto_id: data.proyecto_id === 0 ? null : data.proyecto_id,
                siguiente_reunion: data.siguiente_reunion === "" ? null : data.siguiente_reunion
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
                    .select()
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 text-slate-500 hover:text-slate-900">
                        {isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-[#02457A]">
                        {readonly ? "Detalle de Minuta" : (isEditing ? "Editar Minuta" : "Nueva Minuta")}
                    </SheetTitle>
                    <SheetDescription className="text-slate-500">
                        {readonly ? "Información detallada de la reunión." : "Registro de acuerdos y puntos clave de la reunión."}
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
                                        <FormLabel className="text-slate-900">Fecha Reunión</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} disabled={readonly} className={`bg-white border-slate-200 text-black block w-full ${readonly ? "opacity-100 bg-transparent border-none px-0 font-medium" : ""}`} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="siguiente_reunion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-900">Siguiente Reunión</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} disabled={readonly} className={`bg-white border-slate-200 text-black block w-full ${readonly ? "opacity-100 bg-transparent border-none px-0 font-medium" : ""}`} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="proyecto_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-900">Proyecto</FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        value={field.value?.toString() || "0"}
                                        defaultValue={field.value?.toString()}
                                        disabled={readonly}
                                    >
                                        <FormControl>
                                            <SelectTrigger className={`w-full bg-white border-slate-200 text-black ${readonly ? "opacity-100 bg-transparent border-none px-0 cursor-default font-medium" : ""}`}>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-slate-200 text-slate-900">
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

                        <FormField
                            control={form.control}
                            name="titulo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-900">Título / Objetivo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Revisión Semanal de Avances" {...field} disabled={readonly} className={`bg-white border-slate-200 text-black ${readonly ? "opacity-100 bg-transparent border-none px-0 text-lg font-bold" : ""}`} />
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
                                    <FormLabel className="text-slate-900">Participantes</FormLabel>
                                    <FormControl>
                                        <ListInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Nombre del participante"
                                            name="participantes"
                                            aiEnabled={false}
                                            readonly={readonly}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* List Inputs with AI */}
                        {[
                            { name: "puntos_tratados", label: "Puntos Tratados", placeholder: "Escribe un punto tratado..." },
                            { name: "acuerdos", label: "Acuerdos", placeholder: "Escribe un acuerdo alcanzado..." },
                            { name: "pendientes", label: "Pendientes Siguiente Reunión", placeholder: "Escribe una tarea pendiente..." }
                        ].map((item) => (
                            <FormField
                                key={item.name}
                                control={form.control}
                                name={item.name as any}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-900">{item.label}</FormLabel>
                                        <FormControl>
                                            <ListInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={item.placeholder}
                                                aiEnabled={true}
                                                onAiImprove={(val: string) => handleImproveText(val, field.onChange, item.name)}
                                                isAiImproving={aiImproving}
                                                aiField={aiField}
                                                name={item.name}
                                                readonly={readonly}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant={readonly ? "default" : "ghost"} onClick={() => setOpen(false)} className={readonly ? "bg-slate-100 text-slate-900 hover:bg-slate-200" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"}>
                                {readonly ? "Cerrar" : "Cancelar"}
                            </Button>
                            {!readonly && (
                                <Button type="submit" disabled={saving} className="bg-[#02457A] hover:bg-[#02335a] text-white">
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditing ? "Guardar Cambios" : "Crear Minuta"}
                                </Button>
                            )}
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet >
    )
}
