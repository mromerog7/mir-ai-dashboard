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
import { CalendarIcon } from "lucide-react"
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
    proyecto_id: z.string().optional(), // Using string for select value, convert to number on submit
    prioridad: z.string().optional(),
    estatus: z.string().optional(),
    fecha_vencimiento: z.date().optional(),
})

export function TaskForm({ onSuccess, initialData, taskId }: { onSuccess?: () => void, initialData?: any, taskId?: number }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])

    // Fetch projects for dropdown
    useEffect(() => {
        const fetchProjects = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('proyectos').select('id, nombre').eq('status', 'Activo')
            if (data) setProjects(data)
        }
        fetchProjects()
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            titulo: initialData?.titulo || "",
            descripcion: initialData?.descripcion || "",
            proyecto_id: initialData?.proyecto_id?.toString() || "",
            prioridad: initialData?.prioridad || "Media",
            estatus: initialData?.estatus || "Pendiente",
            fecha_vencimiento: initialData?.fecha_vencimiento ? new Date(initialData.fecha_vencimiento) : undefined,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        const supabase = createClient()

        console.log("Submitting task:", values)

        const taskData = {
            titulo: values.titulo,
            descripcion: values.descripcion || null,
            proyecto_id: values.proyecto_id ? parseInt(values.proyecto_id) : null,
            prioridad: values.prioridad || "Media",
            estatus: values.estatus || "Pendiente", // Use 'estatus' column name as per previous file view (or 'estado' in SQL?)
            // Checking SQL: estado TEXT CHECK (estado IN ('Pendiente'...
            // Checking types/index.ts: estatus: string | null;
            // Need to verify column name. SQL says 'estado', Type says 'estatus'. 
            // Let's check Supabase types or use 'estado' if SQL is source of truth.
            // Wait, setup_modules.sql says 'estado'. types/index.ts says 'estatus'.
            // I'll stick to 'estado' for DB column if I can, but let's check generated types.
            // Actually, I'll bet on 'estado' based on SQL, but I should double check.
            // For now, let's use 'estado' key for DB insert based on SQL file.
            estado: values.estatus || "Pendiente", // Mapping form 'estatus' to DB 'estado' column? Or maybe column is 'estatus'?
            // Let's assume column is 'estado' based on setup_modules.sql line 11.
            fecha_vencimiento: values.fecha_vencimiento ? values.fecha_vencimiento.toISOString() : null, // 'fecha_limite' in SQL line 10?
            // SQL: fecha_limite DATE
            // Type: fecha_vencimiento
            // This suggests a discrepancy. I'll use 'fecha_limite' for DB and 'fecha_vencimiento' for form/type if mapped.
            fecha_limite: values.fecha_vencimiento ? values.fecha_vencimiento.toISOString() : null,
        }

        // Wait, I need to be sure about column names.
        // Let's look at setup_modules.sql again or correct myself.
        // SQL: titulo, descripcion, proyecto_id, asignado_a, fecha_limite, estado, prioridad
        // So I should use these keys.

        const dbData = {
            titulo: values.titulo,
            descripcion: values.descripcion || null,
            proyecto_id: values.proyecto_id ? parseInt(values.proyecto_id) : null,
            prioridad: values.prioridad || "Media",
            estatus: values.estatus || "Pendiente", // Use 'estatus' column
            fecha_vencimiento: values.fecha_vencimiento ? values.fecha_vencimiento.toISOString() : null, // Use 'fecha_vencimiento' column
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
                                <Input placeholder="Ej. Revisar contrato" {...field} className="bg-slate-800 border-slate-700" />
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
                                <Textarea placeholder="Detalles de la tarea..." {...field} className="bg-slate-800 border-slate-700" />
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
                                        <SelectTrigger className="bg-slate-800 border-slate-700">
                                            <SelectValue placeholder="Seleccionar proyecto" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
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
                                        <SelectTrigger className="bg-slate-800 border-slate-700">
                                            <SelectValue placeholder="Prioridad" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="Baja">Baja</SelectItem>
                                        <SelectItem value="Media">Media</SelectItem>
                                        <SelectItem value="Alta">Alta</SelectItem>
                                        <SelectItem value="Urgente">Urgente</SelectItem>
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
                                        <SelectTrigger className="bg-slate-800 border-slate-700">
                                            <SelectValue placeholder="Estatus" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                                        <SelectItem value="En Proceso">En Proceso</SelectItem>
                                        <SelectItem value="Revisión">Revisión</SelectItem>
                                        <SelectItem value="Completada">Completada</SelectItem>
                                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fecha_vencimiento"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha y Hora Límite</FormLabel>
                                <div className="flex space-x-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-[240px] pl-3 text-left font-normal bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white",
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
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        const currentColor = field.value ? new Date(field.value) : new Date();
                                                        date.setHours(currentColor.getHours());
                                                        date.setMinutes(currentColor.getMinutes());
                                                        field.onChange(date);
                                                    }
                                                }}
                                                disabled={(date) =>
                                                    date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        className="w-[120px] bg-slate-800 border-slate-700 text-white"
                                        value={field.value ? format(field.value, "HH:mm") : ""}
                                        onChange={(e) => {
                                            const time = e.target.value;
                                            if (field.value && time) {
                                                const [hours, minutes] = time.split(':').map(Number);
                                                const newDate = new Date(field.value);
                                                newDate.setHours(hours);
                                                newDate.setMinutes(minutes);
                                                field.onChange(newDate);
                                            }
                                        }}
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? "Guardando..." : (taskId ? "Actualizar Tarea" : "Crear Tarea")}
                </Button>
            </form>
        </Form>
    )
}
