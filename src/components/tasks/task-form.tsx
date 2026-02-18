"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { CalendarIcon, AlertTriangle, ChevronDown, DollarSign, Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const formSchema = z.object({
    titulo: z.string().min(2, {
        message: "El título debe tener al menos 2 caracteres.",
    }),
    descripcion: z.string().optional(),
    observaciones: z.string().optional(),
    proyecto_id: z.string().optional(),
    prioridad: z.string().optional(),
    estatus: z.string().optional(),
    fecha_inicio: z.date().optional(),
    fecha_fin: z.date().optional(),
    fecha_inicio_real: z.date().optional(),
    fecha_fin_real: z.date().optional(),
})

// Parse date string as local date to avoid UTC timezone shift
// "2026-02-16T00:00:00Z" → Feb 16 00:00 local (not Feb 15 18:00 CST)
function parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split("T")[0].split("-")
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

export function TaskForm({ onSuccess, initialData, taskId }: { onSuccess?: () => void, initialData?: any, taskId?: number }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [linkedIncidents, setLinkedIncidents] = useState<any[]>([])
    const [expandedIncId, setExpandedIncId] = useState<number | null>(null)

    useEffect(() => {
        const fetchProjects = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('proyectos').select('id, nombre').eq('status', 'Activo')
            if (data) setProjects(data)
        }
        fetchProjects()

        // Fetch linked incidents when editing
        if (taskId) {
            const fetchIncidents = async () => {
                const supabase = createClient()
                const { data } = await supabase
                    .from("incidencia_tareas")
                    .select("incidencia_id, incidencias(id, titulo, descripcion, severidad, estatus, fecha_inicio, impacto_costo, impacto_tiempo, proyectos(nombre))")
                    .eq("tarea_id", taskId)
                if (data) {
                    setLinkedIncidents(data.filter(d => d.incidencias).map(d => d.incidencias))
                }
            }
            fetchIncidents()
        }
    }, [taskId])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            titulo: initialData?.titulo || "",
            descripcion: initialData?.descripcion || "",
            observaciones: initialData?.observaciones || "",
            proyecto_id: initialData?.proyecto_id?.toString() || "",
            prioridad: initialData?.prioridad || "Media",
            estatus: initialData?.estatus || "Pendiente",
            fecha_inicio: initialData?.fecha_inicio ? parseLocalDate(initialData.fecha_inicio) : undefined,
            fecha_fin: initialData?.fecha_fin ? parseLocalDate(initialData.fecha_fin) : undefined,
            fecha_inicio_real: initialData?.fecha_inicio_real ? parseLocalDate(initialData.fecha_inicio_real) : undefined,
            fecha_fin_real: initialData?.fecha_fin_real ? parseLocalDate(initialData.fecha_fin_real) : undefined,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        const supabase = createClient()

        const dbData = {
            titulo: values.titulo,
            descripcion: values.descripcion || null,
            observaciones: values.observaciones || null,
            proyecto_id: values.proyecto_id ? parseInt(values.proyecto_id) : null,
            prioridad: values.prioridad || "Media",
            estatus: values.estatus || "Pendiente",
            fecha_inicio: values.fecha_inicio ? values.fecha_inicio.toISOString() : null,
            fecha_fin: values.fecha_fin ? values.fecha_fin.toISOString() : null,
            fecha_inicio_real: values.fecha_inicio_real ? values.fecha_inicio_real.toISOString() : null,
            fecha_fin_real: values.fecha_fin_real ? values.fecha_fin_real.toISOString() : null,
        }

        let error;
        let data;

        if (taskId) {
            const result = await supabase.from("tareas").update(dbData).eq('id', taskId).select()
            error = result.error
            data = result.data
        } else {
            const result = await supabase.from("tareas").insert(dbData).select()
            error = result.error
            data = result.data
        }

        if (error) {
            console.error("Error saving task:", error)
            alert(`Error al guardar tarea: ${error.message}`)
        } else {
            console.log("Task saved:", data)
            form.reset()
            router.refresh()
            if (onSuccess) onSuccess()
        }
        setLoading(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. Revisar contrato" {...field} className="bg-[#E5E5E5] border-slate-200 text-slate-900 placeholder:text-slate-400" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Detalles de la tarea..." {...field} className="bg-[#E5E5E5] border-slate-200 text-slate-900 placeholder:text-slate-400 min-h-[100px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observaciones</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Observaciones adicionales..." {...field} className="bg-[#E5E5E5] border-slate-200 text-slate-900 placeholder:text-slate-400" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="proyecto_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proyecto</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-[#E5E5E5] border-slate-200 text-slate-900">
                                            <SelectValue placeholder="Seleccionar proyecto" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()} className="hover:bg-slate-100">
                                                {p.nombre}
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
                        name="prioridad"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prioridad</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-[#E5E5E5] border-slate-200 text-slate-900">
                                            <SelectValue placeholder="Prioridad" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                                        <SelectItem value="Baja" className="hover:bg-slate-100">Baja</SelectItem>
                                        <SelectItem value="Media" className="hover:bg-slate-100">Media</SelectItem>
                                        <SelectItem value="Alta" className="hover:bg-slate-100">Alta</SelectItem>
                                        <SelectItem value="Urgente" className="hover:bg-slate-100">Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="estatus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estatus</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-[#E5E5E5] border-slate-200 text-slate-900">
                                            <SelectValue placeholder="Estatus" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                                        <SelectItem value="Pendiente" className="hover:bg-slate-100">Pendiente</SelectItem>
                                        <SelectItem value="En Proceso" className="hover:bg-slate-100">En Proceso</SelectItem>
                                        <SelectItem value="Revisión" className="hover:bg-slate-100">Revisión</SelectItem>
                                        <SelectItem value="Completada" className="hover:bg-slate-100">Completada</SelectItem>
                                        <SelectItem value="Cancelada" className="hover:bg-slate-100">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Date range: Programado */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fecha_inicio"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha Inicio PROG</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal bg-[#E5E5E5] border-slate-200 text-slate-900 hover:bg-slate-100 hover:text-[#02457A]",
                                                    !field.value && "text-slate-400"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: es })
                                                ) : (
                                                    <span>Seleccionar fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 text-slate-400" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fecha_fin"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha Fin PROG</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal bg-[#E5E5E5] border-slate-200 text-slate-900 hover:bg-slate-100 hover:text-[#02457A]",
                                                    !field.value && "text-slate-400"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: es })
                                                ) : (
                                                    <span>Seleccionar fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 text-slate-400" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => {
                                                const inicio = form.getValues("fecha_inicio")
                                                if (inicio && date < inicio) return true
                                                return date < new Date("1900-01-01")
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Date range: Real */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fecha_inicio_real"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha Inicio Real</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal bg-[#E5E5E5] border-slate-200 text-slate-900 hover:bg-slate-100 hover:text-[#02457A]",
                                                    !field.value && "text-slate-400"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: es })
                                                ) : (
                                                    <span>Seleccionar fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 text-slate-400" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fecha_fin_real"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha Fin Real</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: es })
                                                ) : (
                                                    <span>Seleccionar fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => {
                                                const inicio = form.getValues("fecha_inicio_real")
                                                if (inicio && date < inicio) return true
                                                return date < new Date("1900-01-01")
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Incidencias asociadas (solo en modo edición) */}
                {taskId && (
                    <div className="space-y-2 border border-slate-200 rounded-md p-4 bg-slate-50">
                        <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            Incidencias Asociadas
                            {linkedIncidents.length > 0 && (
                                <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">{linkedIncidents.length}</span>
                            )}
                        </h4>
                        {linkedIncidents.length > 0 ? (
                            <div className="space-y-1.5">
                                {linkedIncidents.map((inc: any) => {
                                    const sevColors: Record<string, string> = {
                                        "Baja": "bg-blue-100 text-blue-700",
                                        "Media": "bg-yellow-100 text-yellow-700",
                                        "Alta": "bg-orange-100 text-orange-700",
                                        "Cr\u00edtica": "bg-red-100 text-red-700",
                                    }
                                    const isExpanded = expandedIncId === inc.id
                                    return (
                                        <div key={inc.id} className="bg-white rounded border border-slate-200 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedIncId(isExpanded ? null : inc.id)}
                                                className="w-full flex items-center justify-between p-2 hover:bg-slate-50 transition-colors text-left"
                                            >
                                                <span className="text-xs text-slate-900 font-medium truncate flex-1 mr-2">{inc.titulo}</span>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sevColors[inc.severidad] || ""}`}>{inc.severidad}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${inc.estatus === "Resuelta" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{inc.estatus}</span>
                                                    <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                                </div>
                                            </button>
                                            {isExpanded && (
                                                <div className="px-2.5 pb-2.5 pt-1 border-t border-slate-200 space-y-1.5 bg-slate-50/50">
                                                    {inc.descripcion && (
                                                        <div>
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Descripci\u00f3n</span>
                                                            <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">{inc.descripcion}</p>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <div className="flex items-center gap-1">
                                                            <CalendarIcon className="h-3 w-3 text-slate-500" />
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Fecha</span>
                                                                <span className="text-[11px] text-slate-300">{inc.fecha_inicio ? new Date(inc.fecha_inicio).toLocaleDateString("es-MX") : "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign className="h-3 w-3 text-slate-500" />
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Costo</span>
                                                                <span className="text-[11px] text-slate-300">{inc.impacto_costo ? `$${inc.impacto_costo.toLocaleString()}` : "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-slate-500" />
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Tiempo</span>
                                                                <span className="text-[11px] text-slate-300">{inc.impacto_tiempo || "N/A"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">No hay incidencias asociadas.</p>
                        )}
                    </div>
                )}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? "Guardando..." : (taskId ? "Actualizar Tarea" : "Crear Tarea")}
                </Button>
            </form>
        </Form>
    )
}
