"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Pencil, Plus, Trash2, Save, Loader2, FileText, Copy } from "lucide-react"
// import { useToast } from "@/hooks/use-toast" // Removed
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Quote } from "@/app/(dashboard)/documents/quotes/columns"
import { format } from "date-fns"

const itemSchema = z.object({
    descripcion: z.string().min(1, "Descripción requerida"),
    cantidad: z.coerce.number().min(1, "Mínimo 1"),
    precio: z.coerce.number().min(0, "Precio no negativo"),
    importe: z.coerce.number().optional(), // Calculated
})

const formSchema = z.object({
    folio: z.string().optional(),
    cliente: z.string().min(1, "Cliente requerido"),
    fecha_emision: z.string().min(1, "Fecha requerida"),
    estatus: z.string().min(1, "Estatus requerido"),
    items: z.array(itemSchema),
    proyecto_id: z.coerce.number().optional(),
    solicitante: z.string().optional(),
    ubicacion: z.string().optional(),
    requiere_factura: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

interface EditQuoteSheetProps {
    quote?: Quote
    defaultValues?: Partial<Quote> // For duplication
    trigger?: React.ReactNode
}

export function EditQuoteSheet({ quote, defaultValues, trigger }: EditQuoteSheetProps) {
    const isEditing = !!quote
    const baseData = quote || defaultValues
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [generatingPdf, setGeneratingPdf] = useState(false)
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)
    const [pdfSuccess, setPdfSuccess] = useState(false)
    const [projects, setProjects] = useState<{ id: number; nombre: string }[]>([])
    const router = useRouter()

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

    // Parse initial items
    let initialItems: any[] = []
    try {
        if (baseData?.items_json && typeof baseData.items_json === 'object') {
            if ('lista_productos' in (baseData.items_json as any)) {
                initialItems = (baseData.items_json as any).lista_productos
            } else if (Array.isArray(baseData.items_json)) {
                initialItems = baseData.items_json
            }
        }
    } catch (e) {
        console.error("Error parsing items", e)
    }

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            folio: quote?.folio || "", // Only pre-fill folio if editing
            cliente: baseData?.cliente || "",
            fecha_emision: baseData?.fecha_emision ? baseData.fecha_emision.split('T')[0] : format(new Date(), "yyyy-MM-dd"),
            estatus: "Borrador", // Always reset status for new/duplicated quotes
            items: (initialItems.length > 0 ? initialItems : [{ descripcion: "", cantidad: 1, precio: 0, importe: 0 }]) as any,
            proyecto_id: baseData?.proyecto_id || undefined,
            solicitante: baseData?.solicitante || baseData?.proyectos?.solicitante || "",
            ubicacion: baseData?.ubicacion || baseData?.proyectos?.ubicacion || "",
            requiere_factura: baseData?.requiere_factura !== false,
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    // Calculate totals whenever items or requiere_factura change
    const items = form.watch("items")
    const requiereFactura = form.watch("requiere_factura")

    const calculateTotals = () => {
        const subtotal = items.reduce((acc, item) => {
            return acc + (item.cantidad * item.precio)
        }, 0)
        const ivaRate = requiereFactura ? 0.16 : 0
        const iva = subtotal * ivaRate
        const total = subtotal + iva
        return { subtotal, iva, total }
    }

    const totals = calculateTotals()

    async function saveQuote(data: FormValues, shouldClose: boolean = true) {
        setSaving(true)
        try {
            const supabase = createClient()

            // Construct items_json structure
            const itemsWithImporte = data.items.map(item => ({
                ...item,
                importe: item.cantidad * item.precio
            }))

            const itemsJson = {
                lista_productos: itemsWithImporte
            }

            const { subtotal, iva, total } = calculateTotals()

            const quoteData = {
                cliente: data.cliente,
                fecha_emision: data.fecha_emision,
                estatus: data.estatus,
                items_json: itemsJson,
                subtotal: subtotal,
                iva: iva,
                total: total,
                proyecto_id: data.proyecto_id,
                solicitante: data.solicitante,
                ubicacion: data.ubicacion,
                requiere_factura: data.requiere_factura,
                ...(isEditing ? { folio: data.folio } : {}) // Only include folio if editing
            }

            let error;
            if (isEditing && quote) {
                const response = await supabase
                    .from("cotizaciones")
                    .update(quoteData)
                    .eq("id", quote.id)
                error = response.error
            } else {
                const response = await supabase
                    .from("cotizaciones")
                    .insert(quoteData)
                error = response.error
            }

            if (error) throw error

            if (shouldClose) {
                setOpen(false)
                router.refresh()
                if (!isEditing) {
                    form.reset() // Reset form after creation
                }
            }
        } catch (error: any) {
            console.error("Error updating/creating quote:", error)
            alert(`Error al guardar la cotización: ${error.message}`)
            throw error // Re-throw to allow callers to handle types
        } finally {
            setSaving(false)
        }
    }

    async function onSubmit(data: FormValues) {
        await saveQuote(data, true)
    }

    // Reset form when opening to ensure defaultValues are applied (Duplicate Mode)
    useEffect(() => {
        if (open && !isEditing && defaultValues) {
            form.reset({
                folio: "",
                cliente: defaultValues.cliente || "",
                fecha_emision: format(new Date(), "yyyy-MM-dd"), // Reset date to today for duplication
                estatus: "Borrador",
                items: initialItems.length > 0 ? initialItems : [{ descripcion: "", cantidad: 1, precio: 0, importe: 0 }],
                proyecto_id: defaultValues.proyecto_id || undefined,
                solicitante: defaultValues.solicitante || defaultValues.proyectos?.solicitante || "",
                ubicacion: defaultValues.ubicacion || defaultValues.proyectos?.ubicacion || "",
                requiere_factura: defaultValues.requiere_factura !== false,
            })
        }
    }, [open, isEditing, defaultValues, form, initialItems])

    // Reset form when opening in Edit Mode to ensure latest quote data is used
    useEffect(() => {
        if (open && isEditing && quote) {
            form.reset({
                folio: quote.folio || "",
                cliente: quote.cliente || "",
                fecha_emision: quote.fecha_emision ? quote.fecha_emision.split('T')[0] : format(new Date(), "yyyy-MM-dd"),
                estatus: quote.estatus || "Borrador",
                items: initialItems.length > 0 ? initialItems : [{ descripcion: "", cantidad: 1, precio: 0, importe: 0 }],
                proyecto_id: quote.proyecto_id || undefined,
                solicitante: quote.solicitante || quote.proyectos?.solicitante || "",
                ubicacion: quote.ubicacion || quote.proyectos?.ubicacion || "",
                requiere_factura: quote.requiere_factura !== false,
            })
        }
    }, [open, isEditing, quote, form, initialItems])

    async function handleGeneratePDF() {
        if (!isEditing || !quote) return

        setGeneratingPdf(true)
        try {
            // 1. Save changes first WITHOUT closing the sheet
            await saveQuote(form.getValues(), false) // Pass false to keep sheet open

            // 2. Prepare data for Webhook
            const data = form.getValues()
            const { subtotal, iva, total } = calculateTotals()

            // Find project name
            const project = projects.find(p => p.id === data.proyecto_id)

            const payload = {
                folio: data.folio,
                cliente: data.cliente,
                proyecto_id: data.proyecto_id,
                solicitante: data.solicitante,
                proyecto_nombre: project?.nombre || "",
                fecha: data.fecha_emision,
                ubicacion: data.ubicacion,
                requiere_factura: data.requiere_factura ? "true" : "false",
                items_descripcion: data.items.map(i => i.descripcion),
                items_cantidad: data.items.map(i => i.cantidad.toString()),
                items_precio_unitario: data.items.map(i => i.precio.toString()),
                items_importe: data.items.map(i => (i.cantidad * i.precio).toString()),
                calculo_subtotal: subtotal.toString(),
                calculo_iva: iva.toString(),
                calculo_total: total.toString()
            }

            // 3. Send to n8n Webhook
            const response = await fetch("https://n8n.grupocilar.com/webhook/generar-pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error("Error generating PDF via Webhook")
            }

            const responseData = await response.json()

            if (responseData.pdf_url) {
                setGeneratedPdfUrl(responseData.pdf_url)

                // 4. Update Supabase with valid PDF URL
                const supabase = createClient()
                await supabase
                    .from("cotizaciones")
                    .update({ pdf_url: responseData.pdf_url })
                    .eq("id", quote.id)

                setPdfSuccess(true)
                // alert("PDF Generado correctamente.") // Removed alert to use inline success message
            } else {
                alert("El webhook no devolvió una URL de PDF válida.")
            }

        } catch (error: any) {
            console.error("Error generating PDF:", error)
            alert(`Error al generar PDF: ${error.message}`)
        } finally {
            setGeneratingPdf(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-blue-400">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar Cotización</span>
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-slate-900 border-slate-800 text-white overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-white">{isEditing ? "Editar Cotización" : "Nueva Cotización"}</SheetTitle>
                    <SheetDescription className="text-slate-400">
                        {isEditing ? "Modifica los detalles y los ítems de la cotización." : "Ingresa los datos para crear una nueva cotización."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">

                        {/* Row 1: Folio | Fecha Emisión */}
                        <div className="grid grid-cols-2 gap-4">
                            {isEditing && (
                                <FormField
                                    control={form.control}
                                    name="folio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Folio</FormLabel>
                                            <FormControl>
                                                <Input {...field} readOnly className="bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed focus-visible:ring-0" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="fecha_emision"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Emisión</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-slate-800 border-slate-700 block w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 2: Cliente | Solicitante */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="cliente"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cliente</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-slate-800 border-slate-700" />
                                        </FormControl>
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

                        {/* Row 3: Proyecto | Ubicación */}
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
                                name="ubicacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ubicación</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-slate-800 border-slate-700" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Row 4: Requiere Factura | Estatus */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="requiere_factura"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3 bg-slate-800 mt-[1.7rem]">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Requiere Factura</FormLabel>
                                        </div>
                                        <FormControl>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                                                />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="estatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estatus</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                <SelectItem value="Borrador">Borrador</SelectItem>
                                                <SelectItem value="Enviada">Enviada</SelectItem>
                                                <SelectItem value="Aprobada">Aprobada</SelectItem>
                                                <SelectItem value="Rechazada">Rechazada</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Items Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <h4 className="text-sm font-medium text-slate-300">Ítems / Conceptos</h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ descripcion: "", cantidad: 1, precio: 0 })}
                                    className="h-8 text-xs border-dashed border-slate-600 hover:border-slate-400"
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Agregar Ítem
                                </Button>
                            </div>

                            {/* Headers */}
                            <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-slate-400">
                                <div className="col-span-5">Ítem / Concepto</div>
                                <div className="col-span-2">Cant.</div>
                                <div className="col-span-2">P.Unit</div>
                                <div className="col-span-2">Importe</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-slate-950/30 p-2 rounded">
                                        <div className="col-span-5">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.descripcion`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormControl>
                                                            <textarea
                                                                placeholder="Descripción"
                                                                {...field}
                                                                className="flex min-h-[32px] w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs shadow-sm transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 focus:min-h-[96px] resize-y"
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.cantidad`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormControl>
                                                            <Input type="number" placeholder="Cant." {...field} className="h-8 bg-slate-800 border-slate-700 text-xs" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.precio`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1">
                                                        <FormControl>
                                                            <Input type="number" placeholder="Precio" {...field} className="h-8 bg-slate-800 border-slate-700 text-xs" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <div className="h-8 flex items-center px-3 text-xs text-slate-300 bg-slate-900/50 rounded border border-slate-700/50">
                                                {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
                                                    (items[index]?.cantidad || 0) * (items[index]?.precio || 0)
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals Summary */}
                            <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal:</span>
                                    <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>IVA ({requiereFactura ? "16%" : "0%"}):</span>
                                    <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(totals.iva)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-white border-t border-slate-700 pt-1 mt-1">
                                    <span>Total:</span>
                                    <span className="text-emerald-400">{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(totals.total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 items-center">
                            {/* PDF Success State */}
                            {(isEditing || generatedPdfUrl) && generatedPdfUrl && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => window.open(generatedPdfUrl, '_blank')}
                                    className="hover:bg-slate-800 text-blue-400"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver PDF
                                </Button>
                            )}

                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGeneratePDF}
                                    disabled={saving || generatingPdf}
                                    className="border-blue-500 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
                                >
                                    {generatingPdf ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Generar PDF
                                        </>
                                    )}
                                </Button>
                            )}

                            <Button type="submit" disabled={saving || generatingPdf} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isEditing ? "Guardar Cambios" : "Crear Cotización"}
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
