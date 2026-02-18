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
import { Eye, MapPin, Calendar, ClipboardList, Camera, Wrench, FileText, Ruler } from "lucide-react"
import { Survey } from "@/app/(dashboard)/documents/surveys/columns"
import { Badge } from "@/components/ui/badge"
import { Project } from "@/types"

interface SurveyDetailSheetProps {
    survey: Survey
    project?: Project
    trigger?: React.ReactNode
}

export function SurveyDetailSheet({ survey, project, trigger }: SurveyDetailSheetProps) {
    // Parse photos if string
    let photos: string[] = [];
    try {
        if (Array.isArray(survey.evidencia_fotos)) {
            photos = survey.evidencia_fotos;
        } else if (typeof survey.evidencia_fotos === 'string') {
            // Check if it's a JSON string
            if (survey.evidencia_fotos.startsWith('[')) {
                photos = JSON.parse(survey.evidencia_fotos);
            } else {
                photos = [survey.evidencia_fotos];
            }
        }
    } catch (e) {
        console.error("Error parsing photos", e);
    }

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
            <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    {/* Header: Folio and Project */}
                    <div className="flex justify-between items-start">
                        <div>
                            <SheetTitle className="text-slate-900 text-xl flex items-center gap-2">
                                {survey.folio || "Sin Folio"}
                                <Badge variant={survey.estatus === 'Completado' ? 'secondary' : 'outline'}>
                                    {survey.estatus}
                                </Badge>
                            </SheetTitle>
                            <SheetDescription className="text-slate-500">
                                {project?.nombre || survey.proyectos?.nombre || "Proyecto General"}
                            </SheetDescription>
                        </div>
                        {survey.pdf_final_url && (
                            <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300" onClick={() => window.open(survey.pdf_final_url!, '_blank')}>
                                <FileText className="mr-2 h-4 w-4" /> Ver PDF
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-700 border-b border-slate-200 pb-2">Información General</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Cliente</span>
                                <div className="text-sm font-medium text-slate-700">
                                    {project?.cliente || survey.cliente_prospecto || survey.proyectos?.cliente || "N/A"}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha Visita</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">
                                        {survey.fecha_visita ? new Date(survey.fecha_visita.split('T')[0] + 'T12:00:00').toLocaleDateString("es-MX") : "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Tipo de Servicio</span>
                                <div className="flex items-center gap-1">
                                    <Wrench className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">
                                        {survey.tipo_servicio || "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Ubicación</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium truncate" title={survey.ubicacion || project?.ubicacion || survey.proyectos?.ubicacion}>
                                        {survey.ubicacion || project?.ubicacion || survey.proyectos?.ubicacion || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenido Principal */}

                    {/* 1. Requerimientos (Moved up) */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" /> Requerimientos
                        </h4>
                        <div className="text-sm text-slate-900 whitespace-pre-wrap bg-[#E5E5E5] p-3 rounded-md">
                            {survey.requerimientos || "Sin requerimientos especificados."}
                        </div>
                    </div>

                    {/* 2. Detalles Técnicos (Moved down) */}
                    {survey.detalles_tecnicos && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Detalles Técnicos
                            </h4>
                            <div className="text-sm text-slate-900 whitespace-pre-wrap bg-[#E5E5E5] p-3 rounded-md">
                                {survey.detalles_tecnicos}
                            </div>
                        </div>
                    )}

                    {/* 3. Medidas Aproximadas / Datos Técnicos */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
                            <Ruler className="h-4 w-4" /> Medidas Aproximadas / Datos Técnicos
                        </h4>
                        <div className="text-sm text-slate-900 whitespace-pre-wrap bg-[#E5E5E5] p-3 rounded-md">
                            {survey.medidas_aprox || "Sin medidas registradas."}
                        </div>
                    </div>

                    {/* 4. Evidencia Fotográfica */}
                    {photos.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <Camera className="h-4 w-4" /> Evidencia Fotográfica ({photos.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {photos.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video bg-slate-950 rounded border border-slate-800 overflow-hidden hover:opacity-80 transition-opacity">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
