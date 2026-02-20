"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CalendarIcon, AlertTriangle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const formSchema = z.object({
    nombre: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    cliente: z.string().min(2, {
        message: "El cliente es requerido.",
    }),
    solicitante: z.string().optional(),
    ubicacion: z.string().optional(),
    fecha_inicio: z.date(),
    status: z.enum(["Activo", "Completado"]).default("Activo"),
})

export function ProjectForm({ onSuccess, initialData, projectId }: { onSuccess?: () => void, initialData?: any, projectId?: number | string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [statusError, setStatusError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: initialData?.nombre || "",
            cliente: initialData?.cliente || "",
            solicitante: initialData?.solicitante || "",
            ubicacion: initialData?.ubicacion || "",
            fecha_inicio: initialData?.fecha_inicio ? new Date(initialData.fecha_inicio) : new Date(),
            status: (initialData?.status as "Activo" | "Completado") || "Activo",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setStatusError(null)
        const supabase = createClient()

        // Validate: if marking as Completado, all tasks must be completed
        if (values.status === "Completado" && projectId) {
            const { data: incompleteTasks, error: taskErr } = await supabase
                .from("tareas")
                .select("id, titulo, estatus")
                .eq("proyecto_id", projectId)
                .neq("estatus", "Completada")

            if (taskErr) {
                console.error("Error checking tasks:", taskErr)
            } else if (incompleteTasks && incompleteTasks.length > 0) {
                setStatusError(
                    `No se puede marcar como Completado: hay ${incompleteTasks.length} tarea(s) sin completar (${incompleteTasks.map(t => t.titulo).join(", ")}).`
                )
                setLoading(false)
                return
            }
        }

        console.log("Submitting project:", values)

        let error;
        let data;

        if (projectId) {
            // Update existing project
            const result = await supabase.from("proyectos").update({
                nombre: values.nombre,
                cliente: values.cliente,
                solicitante: values.solicitante || null,
                ubicacion: values.ubicacion || null,
                fecha_inicio: values.fecha_inicio.toISOString(),
                status: values.status,
            }).eq('id', projectId).select()

            error = result.error
            data = result.data
        } else {
            // Create new project
            const result = await supabase.from("proyectos").insert({
                nombre: values.nombre,
                cliente: values.cliente,
                solicitante: values.solicitante || null,
                ubicacion: values.ubicacion || null,
                fecha_inicio: values.fecha_inicio.toISOString(),
                status: "Activo"
            }).select()

            error = result.error
            data = result.data
        }

        if (error) {
            console.error("Error saving project:", error)
            alert(`Error al guardar proyecto: ${error.message}`)
        } else {
            console.log("Project saved:", data)
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
                    name="nombre"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Proyecto</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. Instalación CCTV" {...field} className="bg-[#E5E5E5] border-slate-200 text-slate-900 placeholder:text-slate-400" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cliente"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. Grupo Cilar" {...field} className="bg-[#E5E5E5] border-slate-200 text-slate-900 placeholder:text-slate-400" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="solicitante"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Solicitante</FormLabel>
                                <FormControl>
                                    <Input placeholder="Opcional" {...field} className="bg-[#E5E5E5] border-slate-200 text-slate-900 placeholder:text-slate-400" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ubicacion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ubicación</FormLabel>
                                <FormControl>
                                    <Input placeholder="CDMX" {...field} className="bg-[#E5E5E5] border-slate-200 text-slate-900 placeholder:text-slate-400" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="fecha_inicio"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Inicio</FormLabel>
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
                                        disabled={(date) =>
                                            date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Status field — only shown when editing */}
                {projectId && (
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estatus del Proyecto</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full bg-[#E5E5E5] border-slate-200 text-slate-900">
                                            <SelectValue placeholder="Seleccionar estatus" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Activo">Activo</SelectItem>
                                        <SelectItem value="Completado">Completado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Validation error for status */}
                {statusError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{statusError}</span>
                    </div>
                )}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? "Guardando..." : (projectId ? "Actualizar Proyecto" : "Crear Proyecto")}
                </Button>
            </form>
        </Form>
    )
}
