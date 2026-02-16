"use client"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Eye, User, Calendar, DollarSign, FileText, MapPin } from "lucide-react"
import { Quote } from "@/app/(dashboard)/documents/quotes/columns"
import { Badge } from "@/components/ui/badge"
import { Project } from "@/types"

interface QuoteDetailSheetProps {
    quote: Quote
    project?: Project
    trigger?: React.ReactNode
}

export function QuoteDetailSheet({ quote, project, trigger }: QuoteDetailSheetProps) {
    // Parse items_json if it exists
    let items: any[] = [];
    try {
        if (typeof quote.items_json === 'string') {
            items = JSON.parse(quote.items_json);
        } else if (Array.isArray(quote.items_json)) {
            items = quote.items_json;
        } else if (typeof quote.items_json === 'object' && quote.items_json !== null) {
            // Handle case where it might be wrapped or just an object
            // based on schema image it looked like 'lista_productos': [...] inside json? 
            // or just the array. Let's assume generic structure for now or try to extract 'lista_productos' key
            if ('lista_productos' in (quote.items_json as any)) {
                items = (quote.items_json as any).lista_productos;
            }
        }
    } catch (e) {
        console.error("Error parsing items_json", e);
    }

    if (!Array.isArray(items)) items = [];

    return (
        <Sheet>
            <SheetTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-slate-800">
                        <span className="sr-only">Ver detalles</span>
                        <Eye className="h-4 w-4 text-slate-400 hover:text-white" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-slate-900 border-slate-800 text-white overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-white text-xl flex items-center gap-2">
                        {quote.folio}
                        <Badge variant={quote.estatus === 'Aprobada' ? 'secondary' : 'outline'}>
                            {quote.estatus}
                        </Badge>
                    </SheetTitle>
                    <SheetDescription className="text-slate-400">
                        {project?.nombre || quote.proyectos?.nombre || "Proyecto General"}
                    </SheetDescription>
                </SheetHeader>

                {quote.pdf_url && (
                    <div className="mt-4 flex justify-end">
                        <Button
                            variant="outline"
                            className="bg-slate-950 border-blue-900/50 text-blue-400 hover:bg-slate-900 hover:text-blue-300"
                            onClick={() => window.open(quote.pdf_url!, "_blank")}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Ver PDF
                        </Button>
                    </div>
                )}

                <div className="mt-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Información General</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Cliente</span>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">{project?.cliente || quote.cliente || "N/A"}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Solicitante</span>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">{project?.solicitante || quote.proyectos?.solicitante || "N/A"}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Ubicación</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium truncate" title={project?.ubicacion || quote.ubicacion || quote.proyectos?.ubicacion}>
                                        {project?.ubicacion || quote.ubicacion || quote.proyectos?.ubicacion || "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha Emisión</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">
                                        {quote.fecha_emision ? new Date(quote.fecha_emision.includes('T') ? quote.fecha_emision : `${quote.fecha_emision}T12:00:00`).toLocaleDateString("es-MX") : "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Total</span>
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3 text-emerald-400" />
                                    <span className="text-sm font-bold text-emerald-400">
                                        {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(quote.total || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    {items.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Conceptos / Ítems
                            </h4>
                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <div key={idx} className="bg-slate-950/50 p-3 rounded-md border border-slate-800 flex justify-between items-start text-sm">
                                        <div className="flex-1 mr-4">
                                            <div className="font-medium text-slate-200 whitespace-pre-line">{item.concepto || item.descripcion || "Ítem sin descripción"}</div>
                                            <div className="flex gap-4 text-xs text-slate-500">
                                                {item.cantidad && <span>Cant: {item.cantidad}</span>}
                                                {(item.precio || item.precio_unitario) && (
                                                    <span>
                                                        P. Unit: {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.precio || item.precio_unitario)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="font-medium text-slate-300">
                                            {item.importe ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.importe) :
                                                (item.precio || item.precio_unitario) ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.precio || item.precio_unitario) : "-"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Totals Breakdown */}
                    <div className="flex justify-end pt-4 border-t border-slate-800">
                        <div className="w-1/2 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Subtotal:</span>
                                <span className="text-slate-200 font-medium">
                                    {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(quote.subtotal || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">IVA (16%):</span>
                                <span className="text-slate-200 font-medium">
                                    {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(quote.iva || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-800">
                                <span className="text-white">Total:</span>
                                <span className="text-emerald-400">
                                    {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(quote.total || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
