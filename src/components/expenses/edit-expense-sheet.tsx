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
import { Save, Loader2, ImagePlus, X, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Expense } from "@/types"

const formSchema = z.object({
    proyecto_id: z.coerce.number().min(1, "Proyecto requerido"),
    fecha: z.string().min(1, "Fecha requerida"),
    concepto: z.string().min(1, "Concepto requerido"),
    monto: z.coerce.number().min(0.01, "Monto requerido"),
    categoria: z.string().min(1, "Categoría requerida"),
})

type FormValues = z.infer<typeof formSchema>

interface EditExpenseSheetProps {
    expense: Expense
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditExpenseSheet({ expense, open, onOpenChange }: EditExpenseSheetProps) {
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [projects, setProjects] = useState<{ id: number; nombre: string }[]>([])
    const [budgetCategories, setBudgetCategories] = useState<string[]>([])

    // Image State
    const [newFiles, setNewFiles] = useState<File[]>([])
    const [existingUrls, setExistingUrls] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            proyecto_id: expense.proyecto_id || 0,
            fecha: expense.fecha ? (expense.fecha.includes('T') ? expense.fecha.split('T')[0] : expense.fecha) : format(new Date(), "yyyy-MM-dd"),
            concepto: expense.concepto || "",
            monto: expense.monto || 0,
            categoria: expense.categoria || "",
        },
    })

    // Parse existing URLs and fetch projects on open
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

            // Parse existing URLs
            let urls: string[] = []
            try {
                if (expense.ticket_url) {
                    if (Array.isArray(expense.ticket_url)) {
                        urls = expense.ticket_url
                    } else if (typeof expense.ticket_url === 'string') {
                        if (expense.ticket_url.startsWith('[')) {
                            urls = JSON.parse(expense.ticket_url)
                        } else {
                            urls = [expense.ticket_url]
                        }
                    }
                }
            } catch (e) {
                console.error("Error parsing ticket url", e)
                if (typeof expense.ticket_url === 'string') urls = [expense.ticket_url]
            }
            setExistingUrls(urls || [])
            setNewFiles([])

            // Reset form with current expense data
            form.reset({
                proyecto_id: expense.proyecto_id || 0,
                fecha: expense.fecha ? (expense.fecha.includes('T') ? expense.fecha.split('T')[0] : expense.fecha) : format(new Date(), "yyyy-MM-dd"),
                concepto: expense.concepto || "",
                monto: expense.monto || 0,
                categoria: expense.categoria || "",
            })
        }
    }, [open, expense, form])

    // Fetch Budget Categories when Project (or initial project) changes
    const selectedProjectId = form.watch("proyecto_id")
    useEffect(() => {
        const fetchBudgetCategories = async () => {
            if (!selectedProjectId) {
                setBudgetCategories([])
                return
            }

            const supabase = createClient()
            const { data: budget } = await supabase
                .from("presupuestos")
                .select("id")
                .eq("proyecto_id", selectedProjectId)
                .order("version", { ascending: false })
                .limit(1)
                .single()

            if (budget) {
                const { data: categories } = await supabase
                    .from("presupuesto_categorias")
                    .select("nombre")
                    .eq("presupuesto_id", budget.id)
                    .order("orden", { ascending: true })

                if (categories && categories.length > 0) {
                    setBudgetCategories(categories.map(c => c.nombre))
                    return
                }
            }
            setBudgetCategories([])
        }

        fetchBudgetCategories()
    }, [selectedProjectId])


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)
            setNewFiles(prev => [...prev, ...files])
        }
    }

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingUrl = (index: number) => {
        setExistingUrls(prev => prev.filter((_, i) => i !== index))
    }

    const uploadImages = async (): Promise<string[]> => {
        if (newFiles.length === 0) return []

        const formData = new FormData()
        newFiles.forEach(file => {
            formData.append('files', file)
        })

        try {
            console.log("Starting upload...")
            const response = await fetch('https://n8n.grupocilar.com/webhook/subir-imagen-gasto', {
                method: 'POST',
                body: formData
            })

            console.log("Upload response status:", response.status)

            if (!response.ok) {
                throw new Error('Error uploading images')
            }

            const data = await response.json()
            const dataArray = Array.isArray(data) ? data : [data].filter(Boolean)
            const urls: string[] = []

            dataArray.forEach((item: any) => {
                if (typeof item === 'string') {
                    urls.push(item)
                } else if (typeof item === 'object' && item !== null) {
                    if (item.url) urls.push(item.url)
                    else if (item.ticket_url) urls.push(item.ticket_url)
                    else if (item.urls && Array.isArray(item.urls)) urls.push(...item.urls)
                    else {
                        urls.push(JSON.stringify(item))
                    }
                }
            })
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

            // Combine existing URLs (that weren't deleted) with new uploaded URLs
            const finalUrls = [...existingUrls, ...uploadedUrls]

            const supabase = createClient()

            const expenseData = {
                proyecto_id: data.proyecto_id,
                fecha: data.fecha,
                concepto: data.concepto,
                monto: data.monto,
                categoria: data.categoria,
                ticket_url: finalUrls.length > 0 ? finalUrls : null,
                // We keep the original usuario_id
            }

            const { error } = await supabase
                .from("gastos")
                .update(expenseData)
                .eq("id", expense.id)

            if (error) throw error

            onOpenChange(false)
            router.refresh()
            alert("Gasto actualizado correctamente")

        } catch (error: any) {
            console.error("Error updating expense:", error)
            alert(`Error al actualizar el gasto: ${error.message}`)
        } finally {
            setSaving(false)
            setUploading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-[#02457A]">Editar Gasto</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Modifica los detalles del gasto o gestiona las evidencias.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">

                        {/* Row 1: Proyecto | Fecha */}
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
                                                <SelectTrigger className="w-full bg-[#E5E5E5] border-slate-200 text-slate-900">
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
                                name="fecha"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-[#E5E5E5] border-slate-200 text-slate-900 block w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 2: Monto | Categoría */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="monto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                                className="bg-[#E5E5E5] border-slate-200 text-slate-900"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="categoria"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-[#E5E5E5] border-slate-200 text-slate-900">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                                {budgetCategories.length > 0 ? (
                                                    budgetCategories.map((cat, index) => (
                                                        <SelectItem key={index} value={cat}>{cat}</SelectItem>
                                                    ))
                                                ) : (
                                                    <>
                                                        <SelectItem value="Combustible">Combustible</SelectItem>
                                                        <SelectItem value="Materiales">Materiales</SelectItem>
                                                        <SelectItem value="Mano de Obra">Mano de Obra</SelectItem>
                                                        <SelectItem value="Viáticos">Viáticos</SelectItem>
                                                        <SelectItem value="Administrativo">Administrativo</SelectItem>
                                                        <SelectItem value="Otros">Otros</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Concepto */}
                        <FormField
                            control={form.control}
                            name="concepto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Concepto / Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descripción del gasto"
                                            {...field}
                                            className="bg-[#E5E5E5] border-slate-200 text-slate-900 placeholder:text-slate-400 resize-none h-24"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload for Ticket */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-slate-300">Evidencia (Ticket/Factura)</h4>
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

                            {/* Existing URLs Preview */}
                            {existingUrls.length > 0 && (
                                <div className="space-y-2">
                                    <h5 className="text-xs text-slate-400">Archivos adjuntos:</h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {existingUrls.map((url, idx) => (
                                            <div key={`existing-${idx}`} className="relative group aspect-square rounded-md overflow-hidden bg-slate-950 border border-slate-800">
                                                <img
                                                    src={url}
                                                    alt={`Existing ${idx}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={() => removeExistingUrl(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Files Preview */}
                            {newFiles.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <h5 className="text-xs text-slate-400">Nuevos archivos por subir:</h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {newFiles.map((file, idx) => (
                                            <div key={`new-${idx}`} className="relative group aspect-square rounded-md overflow-hidden bg-slate-950 border border-slate-800">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Preview ${idx}`}
                                                    className="w-full h-full object-cover"
                                                />
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
                                </div>
                            )}

                            {existingUrls.length === 0 && newFiles.length === 0 && (
                                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-800 rounded-md">
                                    No hay evidencias.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving || uploading} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
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
}
