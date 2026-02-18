"use client"

import { useState, useEffect, useRef } from "react"
import { useForm, Resolver } from "react-hook-form"
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
import { Plus, Save, Loader2, ImagePlus, X, AlertTriangle, Pencil, ChevronDown, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Incident } from "@/types"

const formSchema = z.object({
    titulo: z.string().min(1, "Título requerido"),
    proyecto_id: z.coerce.number().min(1, "Proyecto requerido"),
    fecha_inicio: z.string().min(1, "Fecha requerida"),
    severidad: z.string().min(1, "Severidad requerida"),
    estatus: z.string().min(1, "Estatus requerido"),
    impacto_costo: z.coerce.number().optional(),
    impacto_tiempo: z.string().optional().or(z.literal("")),
    descripcion: z.string().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface EditIncidentSheetProps {
    trigger?: React.ReactNode
    incident?: Incident
}

export function EditIncidentSheet({ trigger, incident }: EditIncidentSheetProps) {
    const isEditing = !!incident
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [projects, setProjects] = useState<{ id: number; nombre: string }[]>([])
    const [projectTasks, setProjectTasks] = useState<{ id: number; titulo: string }[]>([])
    const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([])
    const [taskDropdownOpen, setTaskDropdownOpen] = useState(false)

    // Image State
    const [existingPhotos, setExistingPhotos] = useState<string[]>([])
    const [newFiles, setNewFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as Resolver<FormValues>,
        defaultValues: {
            titulo: "",
            proyecto_id: 0,
            fecha_inicio: format(new Date(), "yyyy-MM-dd"),
            severidad: "Baja",
            estatus: "Abierta",
            impacto_costo: 0,
            impacto_tiempo: "",
            descripcion: "",
        },
    })


    // Parse existing photos
    useEffect(() => {
        if (incident?.evidencia_fotos) {
            let photos: string[] = []
            try {
                if (Array.isArray(incident.evidencia_fotos)) {
                    photos = incident.evidencia_fotos
                } else if (typeof incident.evidencia_fotos === 'string') {
                    if (incident.evidencia_fotos.startsWith('[')) {
                        photos = JSON.parse(incident.evidencia_fotos)
                    } else {
                        photos = [incident.evidencia_fotos]
                    }
                }
            } catch (e) {
                console.error("Error parsing photos in edit sheet", e)
            }
            setExistingPhotos(photos)
        } else {
            setExistingPhotos([])
        }
    }, [incident])

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

            if (incident) {
                form.reset({
                    titulo: incident.titulo,
                    proyecto_id: incident.proyecto_id || 0,
                    fecha_inicio: incident.fecha_inicio ? format(new Date(incident.fecha_inicio), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                    severidad: incident.severidad,
                    estatus: incident.estatus,
                    impacto_costo: incident.impacto_costo || 0,
                    impacto_tiempo: incident.impacto_tiempo || "",
                    descripcion: incident.descripcion || "",
                })
                // Load tasks for the incident's project
                if (incident.proyecto_id) {
                    fetchTasksForProject(incident.proyecto_id)
                }
                // Load linked tasks from junction table
                loadLinkedTasks(incident.id)
            } else {
                form.reset({
                    titulo: "",
                    proyecto_id: 0,
                    fecha_inicio: format(new Date(), "yyyy-MM-dd"),
                    severidad: "Baja",
                    estatus: "Abierta",
                    impacto_costo: 0,
                    impacto_tiempo: "",
                    descripcion: "",
                })
                setExistingPhotos([])
                setProjectTasks([])
                setSelectedTaskIds([])
            }
            setNewFiles([])
        }
    }, [open, form, incident])


    // Fetch tasks for a given project
    const fetchTasksForProject = async (projectId: number) => {
        if (!projectId || projectId === 0) {
            setProjectTasks([])
            return
        }
        const supabase = createClient()
        const { data } = await supabase
            .from("tareas")
            .select("id, titulo")
            .eq("proyecto_id", projectId)
            .order("titulo")
        setProjectTasks(data || [])
    }

    // Load linked tasks from junction table
    const loadLinkedTasks = async (incidentId: number) => {
        const supabase = createClient()
        const { data } = await supabase
            .from("incidencia_tareas")
            .select("tarea_id")
            .eq("incidencia_id", incidentId)
        if (data) {
            setSelectedTaskIds(data.map(d => d.tarea_id))
        }
    }

    // Toggle task selection
    const toggleTaskId = (taskId: number) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        )
    }

    // Watch project_id changes to fetch tasks
    const watchedProjectId = form.watch("proyecto_id")
    useEffect(() => {
        if (open && watchedProjectId && watchedProjectId > 0) {
            fetchTasksForProject(watchedProjectId)
        } else {
            setProjectTasks([])
        }
    }, [watchedProjectId, open])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)
            setNewFiles(prev => [...prev, ...files])
        }
    }

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingFile = (index: number) => {
        setExistingPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const uploadImages = async (): Promise<string[]> => {
        if (newFiles.length === 0) return []

        const formData = new FormData()
        newFiles.forEach(file => {
            formData.append('files', file)
        })

        try {
            console.log("Starting upload...")
            const response = await fetch('https://n8n.grupocilar.com/webhook/subir-imagen-incidencia', {
                method: 'POST',
                body: formData
            })

            console.log("Upload response status:", response.status)

            if (!response.ok) {
                throw new Error('Error uploading images')
            }

            const data = await response.json()
            console.log("Upload response data:", data)

            const urls: string[] = []

            if (data.evidencia_fotos) {
                if (Array.isArray(data.evidencia_fotos)) {
                    urls.push(...data.evidencia_fotos)
                } else if (typeof data.evidencia_fotos === 'string') {
                    urls.push(data.evidencia_fotos)
                }
            } else if (Array.isArray(data)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.forEach((item: any) => {

                    if (typeof item === 'string') urls.push(item)
                    else if (typeof item === 'object') {
                        if (item.url) urls.push(item.url)
                        else if (item.evidencia_fotos) urls.push(item.evidencia_fotos)
                    }
                })
            } else if (typeof data === 'object') {
                if (data.url) urls.push(data.url)
                else if (data.urls) {
                    if (Array.isArray(data.urls)) urls.push(...data.urls)
                }
            }

            return urls

        } catch (error) {
            console.error("Upload error:", error)
            throw error
        }
    }


    async function onSubmit(data: FormValues) {
        setSaving(true)
        setUploading(newFiles.length > 0)

        try {
            let uploadedUrls: string[] = []

            if (newFiles.length > 0) {
                uploadedUrls = await uploadImages()
                setUploading(false)
            }

            // Combine existing and new photos
            const finalPhotos = [...existingPhotos, ...uploadedUrls]

            const supabase = createClient()

            const incidentData = {
                titulo: data.titulo,
                descripcion: data.descripcion,
                fecha_inicio: data.fecha_inicio,
                severidad: data.severidad,
                estatus: data.estatus,
                impacto_costo: data.impacto_costo && data.impacto_costo > 0 ? data.impacto_costo : null,
                impacto_tiempo: data.impacto_tiempo || null,
                proyecto_id: data.proyecto_id,
                evidencia_fotos: finalPhotos.length > 0 ? finalPhotos : null,
            }

            let incidentId: number
            if (isEditing && incident) {
                const { error: updateError } = await supabase
                    .from("incidencias")
                    .update(incidentData)
                    .eq("id", incident.id)
                if (updateError) throw updateError
                incidentId = incident.id
            } else {
                const { data: inserted, error: insertError } = await supabase
                    .from("incidencias")
                    .insert(incidentData)
                    .select("id")
                    .single()
                if (insertError) throw insertError
                incidentId = inserted.id
            }

            // Save linked tasks to junction table
            // First delete existing links
            await supabase
                .from("incidencia_tareas")
                .delete()
                .eq("incidencia_id", incidentId)

            // Then insert new links
            if (selectedTaskIds.length > 0) {
                const links = selectedTaskIds.map(tId => ({
                    incidencia_id: incidentId,
                    tarea_id: tId,
                }))
                const { error: linkError } = await supabase
                    .from("incidencia_tareas")
                    .insert(links)
                if (linkError) throw linkError
            }

            setOpen(false)
            router.refresh()
            alert(isEditing ? "Incidencia actualizada correctamente" : "Incidencia registrada correctamente")

        } catch (error) {
            console.error("Error saving incident:", error)
            const message = error instanceof Error ? error.message : "Error desconocido"
            alert(`Error al guardar incidencia: ${message}`)

        } finally {
            setSaving(false)
            setUploading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ? trigger : (
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Incidencia
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-[#02457A]">{isEditing ? "Editar Incidencia" : "Nueva Incidencia"}</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        {isEditing ? "Modifica los detalles del riesgo o incidencia." : "Registra un nuevo riesgo o incidencia en el proyecto."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">

                        {/* Titulo */}
                        <FormField
                            control={form.control}
                            name="titulo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-900">Título</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Resumen del incidente" {...field} className="bg-[#E5E5E5] border-slate-200 text-black placeholder:text-slate-400" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Row 1: Proyecto | Fecha */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="proyecto_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-900">Proyecto</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            defaultValue={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-[#E5E5E5] border-slate-200 text-black">
                                                    <SelectValue placeholder="Seleccionar Proyecto" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 text-slate-900">
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
                                name="fecha_inicio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-900">Fecha Inicio</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-[#E5E5E5] border-slate-200 text-black block w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Tareas vinculadas (multi-select) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900">Tareas Vinculadas</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setTaskDropdownOpen(!taskDropdownOpen)}
                                    className="w-full flex items-center justify-between bg-[#E5E5E5] border border-slate-200 rounded-md px-3 py-2 text-sm text-left hover:bg-slate-200 transition-colors"
                                >
                                    <span className={selectedTaskIds.length === 0 ? "text-slate-500" : "text-slate-900"}>
                                        {selectedTaskIds.length === 0
                                            ? "Sin tareas vinculadas"
                                            : `${selectedTaskIds.length} tarea${selectedTaskIds.length > 1 ? "s" : ""} seleccionada${selectedTaskIds.length > 1 ? "s" : ""}`}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${taskDropdownOpen ? "rotate-180" : ""}`} />
                                </button>
                                {taskDropdownOpen && (
                                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-xl max-h-48 overflow-y-auto">
                                        {projectTasks.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-slate-500">
                                                {watchedProjectId > 0 ? "No hay tareas para este proyecto" : "Selecciona un proyecto primero"}
                                            </div>
                                        ) : (
                                            projectTasks.map((task) => {
                                                const isSelected = selectedTaskIds.includes(task.id)
                                                return (
                                                    <button
                                                        key={task.id}
                                                        type="button"
                                                        onClick={() => toggleTaskId(task.id)}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${isSelected ? "bg-blue-50" : ""
                                                            }`}
                                                    >
                                                        <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected
                                                            ? "bg-blue-600 border-blue-600"
                                                            : "border-slate-300 bg-white"
                                                            }`}>
                                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <span className="text-slate-900 truncate">{task.titulo}</span>
                                                    </button>
                                                )
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Selected tasks chips */}
                            {selectedTaskIds.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {selectedTaskIds.map(id => {
                                        const task = projectTasks.find(t => t.id === id)
                                        if (!task) return null
                                        return (
                                            <span key={id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs">
                                                {task.titulo}
                                                <button type="button" onClick={() => toggleTaskId(id)} className="hover:text-blue-900">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Row 2: Severidad | Estatus */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="severidad"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-900">Severidad</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-[#E5E5E5] border-slate-200 text-black">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                                <SelectItem value="Baja">Baja</SelectItem>
                                                <SelectItem value="Media">Media</SelectItem>
                                                <SelectItem value="Alta">Alta</SelectItem>
                                                <SelectItem value="Crítica">Crítica</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="estatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-900">Estatus</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                                <SelectItem value="Abierta">Abierta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 3: Impacto Costo | Impacto Tiempo */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="impacto_costo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-900">Impacto Costo ($)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                {...field}
                                                className="bg-[#E5E5E5] border-slate-200 text-black placeholder:text-slate-400"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="impacto_tiempo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-900">Impacto Tiempo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. 1 semana" {...field} value={field.value || ""} className="bg-[#E5E5E5] border-slate-200 text-black placeholder:text-slate-400" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Descripción */}
                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-900">Descripción Detallada</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles del incidente"
                                            {...field}
                                            value={field.value || ""}
                                            className="bg-[#E5E5E5] border-slate-200 text-black placeholder:text-slate-400 resize-none h-24"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload for Evidence */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-slate-900">Evidencia Fotográfica</h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-8 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                >
                                    <ImagePlus className="h-4 w-4 mr-2" />
                                    Agregar Fotos
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                />
                            </div>

                            {/* Existing Photos + New Files Preview */}
                            {(existingPhotos.length > 0 || newFiles.length > 0) && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                                    {/* Existing Photos */}
                                    {existingPhotos.map((url, idx) => (
                                        <div key={`existing-${idx}`} className="relative group aspect-video rounded-md overflow-hidden bg-slate-50 border border-slate-200">
                                            <img
                                                src={url}
                                                alt={`Evidence ${idx}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-1 right-1 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white mb-1">
                                                Guardada
                                            </div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={() => removeExistingFile(idx)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* New Files */}
                                    {newFiles.map((file, idx) => (
                                        <div key={`new-${idx}`} className="relative group aspect-video rounded-md overflow-hidden bg-slate-50 border border-slate-200 ring-2 ring-blue-500/50">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${idx}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-1 right-1 bg-blue-600 rounded-full px-2 py-0.5 text-xs text-white mb-1">
                                                Nueva
                                            </div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={() => removeNewFile(idx)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {existingPhotos.length === 0 && newFiles.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-300 rounded-md">
                                    No hay imágenes seleccionadas.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving || uploading} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
                                {saving || uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {uploading ? "Subiendo imágenes..." : "Guardando..."}
                                    </>
                                ) : (
                                    <>
                                        {isEditing ? <Save className="mr-2 h-4 w-4" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                                        {isEditing ? "Guardar Cambios" : "Registrar Incidencia"}
                                    </>
                                )}
                            </Button>
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
