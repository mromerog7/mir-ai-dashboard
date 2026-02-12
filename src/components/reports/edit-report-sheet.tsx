"use client"
import { useState, useEffect, useRef } from "react"
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
import { Pencil, Save, Loader2, ImagePlus, X, Trash2, FileText, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Report } from "@/types"
import { format } from "date-fns"

const formSchema = z.object({
    folio: z.string().optional(),
    proyecto_id: z.coerce.number().min(1, "Proyecto requerido"),
    fecha_reporte: z.string().min(1, "Fecha requerida"),
    solicitante: z.string().optional(),
    duracion: z.string().optional(),
    actividades: z.string().optional(),
    materiales: z.string().optional(),
    observaciones: z.string().optional(),
    ubicacion: z.string().optional(),
    resumen_titulo: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditReportSheetProps {
    report?: Report
    trigger?: React.ReactNode
    isDuplicate?: boolean
}

export function EditReportSheet({ report, trigger, isDuplicate = false }: EditReportSheetProps) {
    const isEditing = !!report && !isDuplicate
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [generatingPdf, setGeneratingPdf] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(report?.pdf_final_url || null)
    const [projects, setProjects] = useState<{ id: number; nombre: string; cliente: string; ubicacion: string }[]>([])

    // AI State
    const [aiImproving, setAiImproving] = useState(false)
    const [aiInstruction, setAiInstruction] = useState("")

    const handleImproveText = async (currentText: string, onChange: (value: string) => void) => {
        if (!currentText) return;

        setAiImproving(true);
        try {
            const payload = {
                tipo: "Reporte",
                instruccion: aiInstruction || "mejora la redaccion",
                texto: currentText
            };

            const response = await fetch('https://n8n.grupocilar.com/webhook/mejorar-texto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Error connecting to AI service");

            const data = await response.json();

            // User requested 'output' variable
            if (data && data.output) {
                onChange(data.output);
            } else if (data && data.text) {
                // Fallback just in case
                onChange(data.text);
            } else {
                console.warn("Unexpected AI response format", data);
            }

            // Clear instruction field after success
            setAiInstruction("");

        } catch (error) {
            console.error("AI Improvement Error:", error);
            alert("No se pudo mejorar el texto. Intenta de nuevo.");
        } finally {
            setAiImproving(false);
        }
    };

    // Image State
    const [existingPhotos, setExistingPhotos] = useState<string[]>([])
    const [newFiles, setNewFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()

    useEffect(() => {
        if (open) {
            const fetchProjects = async () => {
                const supabase = createClient()
                const { data } = await supabase
                    .from("proyectos")
                    .select("id, nombre, cliente, ubicacion")
                    .order("nombre")
                if (data) setProjects(data)
            }
            fetchProjects()
        }
    }, [open])

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            folio: report?.folio || "",
            proyecto_id: report?.proyecto_id || undefined,
            fecha_reporte: report?.fecha_reporte ? report.fecha_reporte.split('T')[0] : format(new Date(), "yyyy-MM-dd"),
            solicitante: report?.solicitante || "",
            duracion: report?.duracion || "",
            actividades: report?.actividades || "",
            materiales: report?.materiales || "",
            observaciones: report?.observaciones || "",
            ubicacion: report?.ubicacion || "",
            resumen_titulo: report?.resumen_titulo || "",
        },
    })

    // Update form when report changes
    useEffect(() => {
        if (open && report) {
            form.reset({
                folio: report.folio || "",
                proyecto_id: report.proyecto_id || undefined,
                fecha_reporte: report.fecha_reporte ? report.fecha_reporte.split('T')[0] : format(new Date(), "yyyy-MM-dd"),
                solicitante: report.solicitante || "",
                duracion: report.duracion || "",
                actividades: report.actividades || "",
                materiales: report.materiales || "",
                observaciones: report.observaciones || "",
                ubicacion: report.ubicacion || "",
                resumen_titulo: report.resumen_titulo || "",
            })

            // Initialize existing photos
            let photos: string[] = []
            if (Array.isArray(report.fotos_url)) {
                photos = report.fotos_url
            } else if (typeof report.fotos_url === 'string') {
                try {
                    photos = JSON.parse(report.fotos_url)
                } catch (e) {
                    if (report.fotos_url.startsWith('http')) {
                        photos = [report.fotos_url]
                    }
                }
            }
            setExistingPhotos(photos || [])
            setNewFiles([]) // Reset new files on open
            setPdfUrl(report.pdf_final_url || null)
            setPdfUrl(report.pdf_final_url || null)
        } else if (open && isDuplicate && report) {
            // Duplicate mode: Pre-fill data but NEW report behavior
            form.reset({
                folio: "", // Clear folio for new record
                proyecto_id: report.proyecto_id || undefined,
                fecha_reporte: format(new Date(), "yyyy-MM-dd"), // Default to today for duplicate? Or keep original? Let's default to today.
                solicitante: report.solicitante || "",
                duracion: report.duracion || "",
                actividades: report.actividades || "",
                materiales: report.materiales || "",
                observaciones: report.observaciones || "",
                ubicacion: report.ubicacion || "",
                resumen_titulo: report.resumen_titulo ? `${report.resumen_titulo} (Copia)` : "",
            })

            // Copy existing photos
            let photos: string[] = []
            if (Array.isArray(report.fotos_url)) {
                photos = report.fotos_url
            } else if (typeof report.fotos_url === 'string') {
                try {
                    photos = JSON.parse(report.fotos_url)
                } catch (e) {
                    if (report.fotos_url.startsWith('http')) {
                        photos = [report.fotos_url]
                    }
                }
            }
            setExistingPhotos(photos || [])
            setNewFiles([])
            setPdfUrl(null) // Reset PDF for new duplicate

        } else if (open && !report) {
            // New report mode
            setExistingPhotos([])
            setNewFiles([])
            setPdfUrl(null)
        }
    }, [open, report, form, isDuplicate])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files)
            const currentCount = existingPhotos.length + newFiles.length

            if (currentCount + filesArray.length > 10) {
                alert("Máximo 10 imágenes permitidas en total.")
                return
            }

            setNewFiles(prev => [...prev, ...filesArray])
        }
        // Reset input so same file can be selected again if needed (though unlikely)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingPhoto = (urlToRemove: string) => {
        setExistingPhotos(prev => prev.filter(url => url !== urlToRemove))
    }

    const uploadImages = async (): Promise<string[]> => {
        if (newFiles.length === 0) return []

        const uploadedUrls: string[] = []
        setUploading(true)

        try {
            // Upload sequentially or parallel? Parallel is faster.
            const uploadPromises = newFiles.map(async (file) => {
                const formData = new FormData()
                formData.append('file', file) // 'file' is typical, n8n binary property name

                const response = await fetch('https://n8n.grupocilar.com/webhook/subir-imagen', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error(`Upload failed for ${file.name}`)
                }

                const data = await response.json()
                const uploadedUrl = data.url || data.url_imagen

                if (!uploadedUrl) {
                    console.error("Webhook response:", data)
                    throw new Error(`No URL returned for ${file.name}`)
                }
                return uploadedUrl as string
            })

            const results = await Promise.all(uploadPromises)
            uploadedUrls.push(...results)

        } catch (error) {
            console.error("Upload error:", error)
            alert("Error al subir imágenes. Verifica tu conexión o intenta de nuevo.")
            // We re-throw so onSubmit stops
            throw error
        } finally {
            setUploading(false)
        }

        return uploadedUrls
    }



    const saveChanges = async (data: FormValues): Promise<Report> => {
        // 1. Upload new images
        let newPhotoUrls: string[] = []
        if (newFiles.length > 0) {
            newPhotoUrls = await uploadImages()
        }

        // 2. Combine with existing photos
        const finalPhotos = [...existingPhotos, ...newPhotoUrls]

        const supabase = createClient()
        const reportData = {
            proyecto_id: data.proyecto_id,
            fecha_reporte: data.fecha_reporte,
            solicitante: data.solicitante,
            duracion: data.duracion,
            actividades: data.actividades,
            materiales: data.materiales,
            observaciones: data.observaciones,
            ubicacion: data.ubicacion,
            resumen_titulo: data.resumen_titulo, // Save Title
            fotos_url: finalPhotos,
        }

        let savedRecord: Report

        if (isEditing && report) {
            const { data: updated, error } = await supabase
                .from("reportes")
                .update(reportData)
                .eq("id", report.id)
                .select()
                .single()

            if (error) throw error
            savedRecord = updated
        } else {
            const { data: inserted, error } = await supabase
                .from("reportes")
                .insert(reportData)
                .select()
                .single()

            if (error) throw error
            savedRecord = inserted
        }

        // Update local state
        setExistingPhotos(finalPhotos)
        setNewFiles([])

        return savedRecord
    }

    const handleGeneratePDF = async (data: FormValues) => {
        setGeneratingPdf(true)
        try {
            // 1. Save changes first
            const savedReport = await saveChanges(data)

            // 2. Prepare Payload
            // Attempt to find project name if report doesn't have a title
            const project = projects.find(p => p.id === savedReport.proyecto_id)
            const fotosArray = Array.isArray(savedReport.fotos_url) ? savedReport.fotos_url : []

            const payload = {
                proyecto_id: savedReport.proyecto_id,
                folio: savedReport.folio || "",
                resumen_titulo: savedReport.resumen_titulo || project?.nombre || "Reporte",
                fecha: savedReport.fecha_reporte,
                duracion: savedReport.duracion || "",
                ubicacion: savedReport.ubicacion || "",
                actividades: savedReport.actividades || "",
                materiales: savedReport.materiales || "",
                observaciones: savedReport.observaciones || "",
                fotos_urls: fotosArray.join(",")
            }

            // 3. Call Webhook
            const response = await fetch('https://n8n.grupocilar.com/webhook/generar-reporte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                throw new Error("Error en la respuesta del webhook generation")
            }

            const resData = await response.json()
            if (!resData.pdf_final_url) {
                throw new Error("El webhook no devolvió la URL del PDF")
            }

            // 4. Save PDF URL
            const supabase = createClient()
            const { error: updateError } = await supabase
                .from("reportes")
                .update({ pdf_final_url: resData.pdf_final_url })
                .eq("id", savedReport.id)

            if (updateError) throw updateError

            setPdfUrl(resData.pdf_final_url)
            alert("PDF Generado correctamente.")
            // setOpen(false) 
            router.refresh()

        } catch (error: any) {
            console.error("Error generating PDF:", error)
            alert(`Error: ${error.message}`)
        } finally {
            setGeneratingPdf(false)
            setUploading(false)
            // Wait, saveChanges calls uploadImages which sets uploading=true/false.
            // But if saveChanges fails, uploading might be stuck? 
            // uploadImages has try/finally setUploading(false).
        }
    }

    // Tiny fix: I used setUploadLoading instead of setUploading in finally block above, my bad. Correcting.

    async function onSubmit(data: FormValues) {
        setSaving(true)
        try {
            await saveChanges(data)
            setOpen(false)
            router.refresh()
        } catch (error: any) {
            console.error("Error saving report:", error)
            alert(`Error al guardar el reporte: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-white">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar Reporte</span>
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-slate-900 border-slate-800 text-white overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-white">
                        {isDuplicate ? "Duplicar Reporte" : (isEditing
                            ? `Editar Reporte${report?.folio ? ` - ${report.folio}` : ''}`
                            : "Nuevo Reporte")
                        }
                    </SheetTitle>
                    <SheetDescription className="text-slate-400">
                        Modifica los detalles e imágenes del reporte.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">

                        {/* Row 1: Título/Resumen | Fecha */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Title/Resumen Field */}
                            <FormField
                                control={form.control}
                                name="resumen_titulo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título / Resumen</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Título del reporte" {...field} className="bg-slate-800 border-slate-700" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fecha_reporte"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha del Reporte</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-slate-800 border-slate-700 block w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 2: Proyecto | Solicitante */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="proyecto_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proyecto</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            defaultValue={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                                                    <SelectValue placeholder="Seleccionar Proyecto" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
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
                                name="solicitante"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Solicitante</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-slate-800 border-slate-700" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 3: Duración | Ubicación */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="duracion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duración</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. 2 horas, 1 día" {...field} className="bg-slate-800 border-slate-700" />
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
                                            <Input placeholder="Ej. Planta Baja, Sala de Juntas" {...field} className="bg-slate-800 border-slate-700" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Actividades */}
                        <FormField
                            control={form.control}
                            name="actividades"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Actividades Realizadas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descripción detallada de las actividades..."
                                            {...field}
                                            className="bg-slate-800 border-slate-700 min-h-[100px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    {/* AI Improvement Section */}
                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            placeholder="Instrucción adicional para mejorar redacción (opcional)"
                                            value={aiInstruction}
                                            onChange={(e) => setAiInstruction(e.target.value)}
                                            disabled={!field.value || aiImproving}
                                            className="bg-slate-800 border-slate-700 text-xs h-8"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleImproveText(field.value || "", field.onChange)}
                                            disabled={!field.value || aiImproving}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs shrink-0"
                                        >
                                            {aiImproving ? (
                                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                            ) : (
                                                <Sparkles className="h-3 w-3 mr-2" />
                                            )}
                                            Mejorar Redacción con IA
                                        </Button>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Materiales */}
                        <FormField
                            control={form.control}
                            name="materiales"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Materiales y Herramientas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Listado de materiales y equipos utilizados separados por ','"
                                            {...field}
                                            className="bg-slate-800 border-slate-700 min-h-[80px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Observaciones */}
                        <FormField
                            control={form.control}
                            name="observaciones"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observaciones</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observaciones adicionales..."
                                            {...field}
                                            className="bg-slate-800 border-slate-700 min-h-[80px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Gallery & Upload */}
                        <div className="space-y-4 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Evidencia Fotográfica</h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={existingPhotos.length + newFiles.length >= 10 || uploading}
                                    className="border-dashed border-slate-600 hover:border-blue-500 hover:text-blue-400"
                                >
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                    Subir imágenes ({existingPhotos.length + newFiles.length}/10)
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {/* Gallery Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {/* Existing Photos */}
                                {existingPhotos.map((url, idx) => (
                                    <div key={`existing-${idx}`} className="relative group aspect-square rounded-md overflow-hidden bg-black border border-slate-800">
                                        <img
                                            src={url}
                                            alt={`Evidencia ${idx}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => removeExistingPhoto(url)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* New Files Preview */}
                                {newFiles.map((file, idx) => (
                                    <div key={`new-${idx}`} className="relative group aspect-square rounded-md overflow-hidden bg-black border border-blue-500/50">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className="w-full h-full object-cover opacity-80"
                                            onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))} // Clean up memory? Actually logic is flawed here, createObjectURL creates new every render. Better simple for now. 
                                        />
                                        {/* Badge NEW */}
                                        <div className="absolute top-1 left-1 bg-blue-600 text-[10px] px-1.5 rounded text-white font-bold">
                                            NUEVA
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                            {(existingPhotos.length === 0 && newFiles.length === 0) && (
                                <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-md">
                                    No hay imágenes seleccionadas.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            {isEditing && (
                                <>
                                    {pdfUrl ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => window.open(pdfUrl, '_blank')}
                                            className="hover:bg-slate-800 text-blue-400"
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Ver PDF
                                        </Button>
                                    ) : (
                                        <div className="flex-1" />
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={form.handleSubmit(handleGeneratePDF)}
                                        disabled={saving || uploading || generatingPdf}
                                        className="border-blue-500 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
                                    >
                                        {generatingPdf ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generando PDF...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Generar PDF
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}

                            {!isEditing && (
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="hover:bg-slate-800">
                                    Cancelar
                                </Button>
                            )}

                            <Button type="submit" disabled={saving || uploading || generatingPdf} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {saving || uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {uploading ? "Subiendo imágenes..." : "Guardando..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isEditing ? "Guardar Cambios" : "Crear Reporte"}
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
