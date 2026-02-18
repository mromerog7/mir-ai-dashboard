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
import { Survey } from "@/app/(dashboard)/documents/surveys/columns"
import { format } from "date-fns"

const formSchema = z.object({
    folio: z.string().optional(),
    proyecto_id: z.coerce.number().optional(), // Changed to optional to allow 0/null ("General")
    fecha_visita: z.string().min(1, "Fecha requerida"),
    tipo_servicio: z.string().optional(),
    cliente_prospecto: z.string().optional(),
    ubicacion: z.string().optional(),
    estatus: z.string().optional(),
    detalles_tecnicos: z.string().optional(),
    requerimientos: z.string().optional(),
    medidas_aprox: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditSurveySheetProps {
    survey?: Survey
    trigger?: React.ReactNode
    isDuplicate?: boolean
}

export function EditSurveySheet({ survey, trigger, isDuplicate = false }: EditSurveySheetProps) {
    const isEditing = !!survey && !isDuplicate
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [projects, setProjects] = useState<{ id: number; nombre: string; cliente: string; ubicacion: string }[]>([])

    // AI State
    const [aiImproving, setAiImproving] = useState(false)
    const [aiInstruction, setAiInstruction] = useState("")

    const handleImproveText = async (currentText: string, onChange: (value: string) => void) => {
        if (!currentText) return;

        setAiImproving(true);
        try {
            const payload = {
                tipo: "Levantamiento",
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
            folio: survey?.folio || "",
            proyecto_id: survey?.proyecto_id || 0, // Default to 0 (General) if null
            fecha_visita: survey?.fecha_visita ? survey.fecha_visita.split('T')[0] : format(new Date(), "yyyy-MM-dd"),
            tipo_servicio: survey?.tipo_servicio || "",
            cliente_prospecto: survey?.cliente_prospecto || "",
            ubicacion: survey?.ubicacion || "",
            estatus: survey?.estatus || "Pendiente Cotizar",
            detalles_tecnicos: survey?.detalles_tecnicos || "",
            requerimientos: survey?.requerimientos || "",
            medidas_aprox: survey?.medidas_aprox || "",
        },
    })

    useEffect(() => {
        if (open && survey) {
            form.reset({
                folio: isDuplicate ? "" : (survey.folio || ""),
                proyecto_id: survey.proyecto_id || 0, // Default to 0 (General) if null
                fecha_visita: survey.fecha_visita ? survey.fecha_visita.split('T')[0] : format(new Date(), "yyyy-MM-dd"),
                tipo_servicio: survey.tipo_servicio || "",
                cliente_prospecto: survey.cliente_prospecto || "",
                ubicacion: survey.ubicacion || "",
                estatus: "Pendiente Cotizar", // Reset status on duplicate? Usually yes.
                detalles_tecnicos: survey.detalles_tecnicos || "",
                requerimientos: survey.requerimientos || "",
                medidas_aprox: survey.medidas_aprox || "",
            })

            // Initialize existing photos
            let photos: string[] = []
            if (Array.isArray(survey.evidencia_fotos)) {
                photos = survey.evidencia_fotos
            } else if (typeof survey.evidencia_fotos === 'string') {
                try {
                    photos = JSON.parse(survey.evidencia_fotos)
                } catch (e) {
                    if ((survey.evidencia_fotos as string).startsWith('http')) {
                        photos = [survey.evidencia_fotos]
                    }
                }
            }
            setExistingPhotos(photos || [])
            setNewFiles([])
        }
    }, [open, survey, form])

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
            const uploadPromises = newFiles.map(async (file) => {
                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch('https://n8n.grupocilar.com/webhook/subir-imagen-lev', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error(`Upload failed for ${file.name}`)
                }

                const data = await response.json()
                // webhook returns url in 'evidencia_fotos' or 'url'? User said: "te regresara una url en la variable evidencia_fotos"
                const uploadedUrl = data.evidencia_fotos || data.url || data.url_imagen

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
            throw error
        } finally {
            setUploading(false)
        }

        return uploadedUrls
    }

    async function onSubmit(data: FormValues) {
        setSaving(true)
        try {
            // 1. Upload new images
            let newPhotoUrls: string[] = []
            if (newFiles.length > 0) {
                newPhotoUrls = await uploadImages()
            }

            // 2. Combine with existing photos
            const finalPhotos = [...existingPhotos, ...newPhotoUrls]

            const supabase = createClient()
            const surveyData = {
                proyecto_id: data.proyecto_id === 0 ? null : data.proyecto_id, // Handle 0 as null
                fecha_visita: data.fecha_visita,
                tipo_servicio: data.tipo_servicio,
                cliente_prospecto: data.cliente_prospecto,
                ubicacion: data.ubicacion,
                estatus: data.estatus,
                detalles_tecnicos: data.detalles_tecnicos,
                requerimientos: data.requerimientos,
                medidas_aprox: data.medidas_aprox,
                evidencia_fotos: finalPhotos,
            }

            if (isEditing && survey) {
                const { error } = await supabase
                    .from("levantamientos")
                    .update(surveyData)
                    .eq("id", survey.id)

                if (error) throw error
            } else {
                // Insert mode logic if needed later
                const { error } = await supabase
                    .from("levantamientos")
                    .insert(surveyData)
                if (error) throw error
            }

            setOpen(false)
            setNewFiles([])
            router.refresh()

        } catch (error: any) {
            console.error("Error saving survey:", error)
            alert(`Error al guardar: ${error.message}`)
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
                        <span className="sr-only">Editar Levantamiento</span>
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-slate-900">
                        {isEditing ? `Editar Levantamiento${survey?.folio ? ` - ${survey.folio}` : ''}` : "Nuevo Levantamiento"}
                    </SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Modifica los detalles del levantamiento y evidencia.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">

                        {/* Row 1: Tipo Servicio | Fecha */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tipo_servicio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Servicio</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-[#E5E5E5] border-slate-200 text-black">
                                                    <SelectValue placeholder="Seleccionar Tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                                {['CCTV', 'Redes', 'Automatización', 'Obra Civil', 'Eléctrico', 'Software'].map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
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
                                name="fecha_visita"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Visita</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-[#E5E5E5] border-slate-200 text-black block w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 2: Proyecto | Cliente */}
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
                                                <SelectTrigger className="w-full bg-[#E5E5E5] border-slate-200 text-black">
                                                    <SelectValue placeholder="Seleccionar Proyecto" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                                <SelectItem value="0">Proyecto General (Sin Asignar)</SelectItem>
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
                                name="cliente_prospecto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cliente / Prospecto</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-[#E5E5E5] border-slate-200 text-black" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 3: Ubicación | Estatus */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="ubicacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ubicación</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ubicación del sitio" {...field} className="bg-[#E5E5E5] border-slate-200 text-black" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="estatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estatus</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-[#E5E5E5] border-slate-200 text-black">
                                                    <SelectValue placeholder="Seleccionar Estatus" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                                <SelectItem value="Pendiente Cotizar">Pendiente Cotizar</SelectItem>
                                                <SelectItem value="Cotizado">Cotizado</SelectItem>
                                                <SelectItem value="Descartado">Descartado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Requerimientos */}
                        <FormField
                            control={form.control}
                            name="requerimientos"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Requerimientos</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describa los requerimientos..."
                                            {...field}
                                            className="bg-[#E5E5E5] border-slate-200 text-black min-h-[80px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Detalles Técnicos */}
                        <FormField
                            control={form.control}
                            name="detalles_tecnicos"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Detalles Técnicos</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles técnicos observados..."
                                            {...field}
                                            className="bg-[#E5E5E5] border-slate-200 text-black min-h-[100px]"
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
                                            className="bg-[#E5E5E5] border-slate-200 text-black text-xs h-8"
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

                        {/* Medidas Aproximadas */}
                        <FormField
                            control={form.control}
                            name="medidas_aprox"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Medidas Aproximadas / Datos</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Medias. distancias, datos técnicos separados por '.'"
                                            {...field}
                                            className="bg-[#E5E5E5] border-slate-200 text-black min-h-[80px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Gallery */}
                        <div className="space-y-4 pt-2 border-t border-slate-200">
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

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {existingPhotos.map((url, idx) => (
                                    <div key={`existing-${idx}`} className="relative group aspect-square rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                                        <img src={url} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
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
                                {newFiles.map((file, idx) => (
                                    <div key={`new-${idx}`} className="relative group aspect-square rounded-md overflow-hidden bg-black border border-blue-500/50">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className="w-full h-full object-cover opacity-80"
                                            onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                        />
                                        <div className="absolute top-1 left-1 bg-blue-600 text-[10px] px-1.5 rounded text-white font-bold">NUEVA</div>
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
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-2 pt-4">
                            {survey?.pdf_final_url && !isDuplicate ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => window.open(survey.pdf_final_url!, '_blank')}
                                    className="hover:bg-slate-800 text-blue-400"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver PDF
                                </Button>
                            ) : (
                                <div className="flex-1" />
                            )}


                            {/* Generate PDF Button - Only show when editing */}
                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                    onClick={handleGeneratePDF}
                                    disabled={saving || uploading}
                                >
                                    {saving && !uploading ? (
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
                            )}

                            <Button type="submit" disabled={saving || uploading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {saving || uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {uploading ? "Subiendo imágenes..." : "Guardando..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )

    async function handleGeneratePDF() {
        // 1. Validate form
        const isValid = await form.trigger()
        if (!isValid) {
            alert("Por favor completa los campos requeridos antes de generar el PDF.")
            return
        }

        setSaving(true) // Re-using saving state for loading indicator

        try {
            const data = form.getValues()

            // 2. Upload new images
            let newPhotoUrls: string[] = []
            if (newFiles.length > 0) {
                // If we have new files, we need to upload them first
                // Set uploading true mostly for the text, but logic runs here
                setUploading(true)
                try {
                    newPhotoUrls = await uploadImages()
                } finally {
                    setUploading(false)
                }
            }

            // Combine photos
            const finalPhotos = [...existingPhotos, ...newPhotoUrls]

            // 3. Save current state to Supabase first
            const supabase = createClient()
            const surveyData = {
                proyecto_id: data.proyecto_id === 0 ? null : data.proyecto_id,
                fecha_visita: data.fecha_visita,
                tipo_servicio: data.tipo_servicio,
                cliente_prospecto: data.cliente_prospecto,
                ubicacion: data.ubicacion,
                estatus: data.estatus,
                detalles_tecnicos: data.detalles_tecnicos,
                requerimientos: data.requerimientos,
                medidas_aprox: data.medidas_aprox,
                evidencia_fotos: finalPhotos,
            }

            let currentSurveyId = survey?.id

            if (isEditing && survey) {
                const { error } = await supabase
                    .from("levantamientos")
                    .update(surveyData)
                    .eq("id", survey.id)
                if (error) throw error
            } else {
                // If creating new, insert first to get ID
                const { data: newSurvey, error } = await supabase
                    .from("levantamientos")
                    .insert(surveyData)
                    .select()
                    .single()
                if (error) throw error
                currentSurveyId = newSurvey.id
            }

            // 4. Call Webhook
            // Payload structure: { proyect_id, foliio, cliente_prospecto, fecha, ubicacion, detalles_tecnicos, tipo_servicio, medidas_aprox, requerimientos, evidencia_fotos }
            const webhookPayload = {
                proyect_id: data.proyecto_id === 0 ? "0" : data.proyecto_id, // Ensure it sends 0 or ID
                foliio: data.folio || "SIN FOLIO", // Note: User typo "foliio" in request, maintaining strictly
                cliente_prospecto: data.cliente_prospecto || "N/A",
                fecha: data.fecha_visita,
                ubicacion: data.ubicacion || "N/A",
                detalles_tecnicos: data.detalles_tecnicos || "N/A",
                tipo_servicio: data.tipo_servicio || "N/A",
                medidas_aprox: data.medidas_aprox || "N/A",
                requerimientos: data.requerimientos || "N/A",
                evidencia_fotos: finalPhotos.join(",") // Comma separated string
            }

            console.log("Sending webhook payload:", webhookPayload)

            const response = await fetch('https://n8n.grupocilar.com/webhook/generar-levantamiento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookPayload)
            })

            if (!response.ok) {
                throw new Error(`Error en generación de PDF: ${response.statusText}`)
            }

            const resData = await response.json()
            const pdfUrl = resData.pdf_final_url

            if (!pdfUrl) {
                throw new Error("El webhook no devolvió la URL del PDF (pdf_final_url)")
            }

            // 5. Update Supabase with PDF URL
            if (currentSurveyId) {
                const { error: updateError } = await supabase
                    .from("levantamientos")
                    .update({ pdf_final_url: pdfUrl })
                    .eq("id", currentSurveyId)

                if (updateError) throw updateError
            }

            alert("PDF Generado exitosamente.")
            setOpen(false)
            setNewFiles([])
            router.refresh()
            // Optional: Open PDF? window.open(pdfUrl, '_blank')

        } catch (error: any) {
            console.error("Error generating PDF:", error)
            alert(`Error: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }
}
