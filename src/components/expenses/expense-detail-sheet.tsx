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
import { Eye, MapPin, User, Calendar, FileText, Camera, DollarSign, Tag, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Expense } from "@/types"

interface ExpenseDetailSheetProps {
    expense: Expense
    iconOnly?: boolean
}

export function ExpenseDetailSheet({ expense, iconOnly = false }: ExpenseDetailSheetProps) {
    // Parse photos/ticket if string
    let photos: string[] = [];
    try {
        if (expense.ticket_url) {
            if (Array.isArray(expense.ticket_url)) {
                photos = expense.ticket_url;
            } else if (typeof expense.ticket_url === 'string') {
                if (expense.ticket_url.startsWith('[')) {
                    try {
                        photos = JSON.parse(expense.ticket_url);
                    } catch (e) {
                        photos = [expense.ticket_url];
                    }
                } else {
                    photos = [expense.ticket_url];
                }
            }
        }
    } catch (e) {
        console.error("Error parsing ticket url", e);
        if (expense.ticket_url && typeof expense.ticket_url === 'string') photos = [expense.ticket_url];
    }

    if (!photos) photos = [];

    return (
        <Sheet>
            <SheetTrigger asChild>
                {iconOnly ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 text-blue-600">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver Detalles</span>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" className="w-full mt-4 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors">
                        <Camera className="mr-2 h-4 w-4" />
                        Ver Evidencias
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-[#02457A] text-xl flex flex-col gap-2 items-start">
                        <span className="break-words w-full text-left">{expense.concepto}</span>
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(expense.monto)}
                        </Badge>
                    </SheetTitle>
                    <SheetDescription className="text-slate-500 text-left">
                        {expense.proyectos?.nombre || "Gasto General / Sin Proyecto"}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2">Información del Gasto</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-900">
                                        {(() => {
                                            if (!expense.fecha) return "N/A";
                                            const dateStr = expense.fecha.includes('T') ? expense.fecha : `${expense.fecha}T00:00:00`;
                                            const date = new Date(dateStr);
                                            return !isNaN(date.getTime()) ? format(date, "PPP", { locale: es }) : "Fecha inválida";
                                        })()}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Categoría</span>
                                <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-900">
                                        {expense.categoria || "N/A"}
                                    </span>
                                </div>
                            </div>
                            {expense.metodo_pago && (
                                <div>
                                    <span className="text-xs text-slate-500 block">Método de Pago</span>
                                    <div className="flex items-center gap-1">
                                        <CreditCard className="h-3 w-3 text-slate-500" />
                                        <span className="text-sm font-medium text-slate-900">
                                            {expense.metodo_pago}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div>
                                <span className="text-xs text-slate-500 block">Ubicación (Proyecto)</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium truncate text-slate-900" title={expense.proyectos?.ubicacion}>
                                        {expense.proyectos?.ubicacion || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Photos Gallery (Ticket) */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                            <Camera className="h-4 w-4" /> Evidencia (Ticket) ({photos.length})
                        </h4>

                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {photos.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-[3/4] bg-slate-50 rounded border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt={`Ticket ${idx + 1}`} className="w-full h-full object-contain" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No hay ticket adjunto.</p>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
