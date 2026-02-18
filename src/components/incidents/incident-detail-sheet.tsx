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
import { Eye, MapPin, User, Calendar, FileText, Camera, AlertTriangle, Clock, CheckCircle, ListChecks } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Incident } from "@/types"

interface IncidentDetailSheetProps {
    incident: Incident
    trigger?: React.ReactNode
}

export function IncidentDetailSheet({ incident, trigger }: IncidentDetailSheetProps) {
    // Parse photos if string
    let photos: string[] = [];
    try {
        if (Array.isArray(incident.evidencia_fotos)) {
            photos = incident.evidencia_fotos;
        } else if (typeof incident.evidencia_fotos === 'string') {
            if (incident.evidencia_fotos.startsWith('[')) {
                photos = JSON.parse(incident.evidencia_fotos);
            } else {
                photos = [incident.evidencia_fotos];
            }
        }
    } catch (e) {
        console.error("Error parsing photos", e);
    }

    if (!photos) photos = [];

    const severityColors: Record<string, string> = {
        "Baja": "bg-blue-500/10 text-blue-500 border-blue-500/20",
        "Media": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        "Alta": "bg-orange-500/10 text-orange-500 border-orange-500/20",
        "Crítica": "bg-red-500/10 text-red-500 border-red-500/20",
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" size="sm" className="w-full mt-4 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">
                        <Camera className="mr-2 h-4 w-4" />
                        Ver Evidencias
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-slate-900 border-slate-800 text-white overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-white text-xl flex flex-col gap-2 items-start">
                        <span className="break-words w-full text-left">{incident.titulo}</span>
                        <div className="flex gap-2">
                            <Badge variant="outline" className={`${severityColors[incident.severidad] || "text-white"} border`}>
                                {incident.severidad}
                            </Badge>
                            <Badge variant={incident.estatus === "Resuelta" ? "secondary" : "destructive"}>
                                {incident.estatus}
                            </Badge>
                        </div>
                    </SheetTitle>
                    <SheetDescription className="text-slate-400 text-left">
                        {incident.proyectos?.nombre || "Proyecto General"}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Información del Incidente</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha Inicio</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">
                                        {incident.fecha_inicio ? format(new Date(incident.fecha_inicio.split('T')[0] + 'T00:00:00'), "PPP", { locale: es }) : "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Impacto Costo</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium text-slate-200">
                                        {incident.impacto_costo ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(incident.impacto_costo) : "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Impacto Tiempo</span>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">
                                        {incident.impacto_tiempo || "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Ubicación</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium truncate" title={incident.proyectos?.ubicacion}>
                                        {incident.proyectos?.ubicacion || "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Tareas Vinculadas</span>
                                <div className="flex items-start gap-1 mt-1">
                                    <ListChecks className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex flex-wrap gap-1">
                                        {incident.incidencia_tareas && incident.incidencia_tareas.length > 0 ? (
                                            incident.incidencia_tareas.map((link, idx) => (
                                                <span key={idx} className="inline-flex items-center bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-full px-2 py-0.5 text-xs">
                                                    {link.tareas?.titulo}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm font-medium text-slate-400">Sin tareas</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Descripción
                        </h4>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950/50 p-3 rounded-md min-h-[100px]">
                            {incident.descripcion || "Sin descripción."}
                        </div>
                    </div>

                    {/* Photos Gallery */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <Camera className="h-4 w-4" /> Evidencia Fotográfica ({photos.length})
                        </h4>

                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {photos.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video bg-slate-950 rounded border border-slate-800 overflow-hidden hover:opacity-80 transition-opacity">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No hay imágenes adjuntas.</p>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
