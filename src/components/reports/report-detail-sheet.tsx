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
import { Eye, MapPin, User, Calendar, FileText, Camera, Clock, Wrench } from "lucide-react"
import { Report } from "@/types"
import Image from "next/image"
import { Project } from "@/types"

interface ReportDetailSheetProps {
    report: Report
    project?: Project
    trigger?: React.ReactNode
}

export function ReportDetailSheet({ report, project, trigger }: ReportDetailSheetProps) {
    // Parse photos if string
    let photos: string[] = [];
    if (Array.isArray(report.fotos_url)) {
        photos = report.fotos_url;
    } else if (typeof report.fotos_url === 'string') {
        try {
            photos = JSON.parse(report.fotos_url);
        } catch (e) {
            // If not JSON, maybe just a single URL string?
            if (report.fotos_url.startsWith('http')) {
                photos = [report.fotos_url];
            }
        }
    }

    // Safely handle photos if it's null
    if (!photos) photos = [];

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
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-white text-xl">{report.folio || "Reporte sin folio"}</SheetTitle>
                        {report.pdf_final_url && (
                            <Button variant="outline" size="sm" onClick={() => window.open(report.pdf_final_url!, '_blank')} className="gap-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/30 hover:text-emerald-300">
                                <FileText className="h-4 w-4" />
                                Ver PDF
                            </Button>
                        )}
                    </div>
                    <SheetDescription className="text-slate-400">
                        {report.resumen_titulo}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Project Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Información del Proyecto</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Proyecto</span>
                                <span className="text-sm font-medium">{project?.nombre || report.proyectos?.nombre || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Cliente</span>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">{project?.cliente || report.proyectos?.cliente || "N/A"}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Solicitante</span>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">{report.solicitante || "N/A"}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Ubicación</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium truncate" title={project?.ubicacion || report.proyectos?.ubicacion}>
                                        {project?.ubicacion || report.proyectos?.ubicacion || "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">
                                        {report.fecha_reporte ? new Date(report.fecha_reporte).toLocaleDateString("es-MX", { timeZone: "UTC" }) : "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Duración</span>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium">{report.duracion || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activities */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Actividades Realizadas
                        </h4>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950/50 p-3 rounded-md min-h-[80px]">
                            {report.actividades || "Sin descripción de actividades."}
                        </div>
                    </div>

                    {/* Materials */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <Wrench className="h-4 w-4" /> Materiales y Herramientas
                        </h4>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950/50 p-3 rounded-md min-h-[60px]">
                            {report.materiales || "Sin materiales registrados."}
                        </div>
                    </div>

                    {/* Observations */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <Eye className="h-4 w-4" /> Observaciones
                        </h4>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950/50 p-3 rounded-md min-h-[60px]">
                            {report.observaciones || "Sin observaciones."}
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
                                    <div key={idx} className="relative aspect-video rounded-md overflow-hidden bg-slate-950 border border-slate-800 group">
                                        {/* Using img tag with unoptimized for external R2 URLs */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={url}
                                            alt={`Evidencia ${idx + 1}`}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-6 text-xs"
                                                onClick={() => window.open(url, '_blank')}
                                            >
                                                Ver original
                                            </Button>
                                        </div>
                                    </div>
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
