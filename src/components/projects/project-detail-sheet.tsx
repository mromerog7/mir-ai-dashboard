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
import { Eye, MapPin, User, Calendar, Briefcase, CheckCircle, AlertTriangle, FileText, FileSpreadsheet, ClipboardList, BookOpen, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Project, Task, Incident, Survey, Quote, Report, Minuta, ClientMeeting } from "@/types"
import { useEffect, useState } from "react"
import { getProjectDetails } from "@/app/actions/get-project-details"

import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet"
import { IncidentDetailSheet } from "@/components/incidents/incident-detail-sheet"
import { SurveyDetailSheet } from "@/components/surveys/survey-detail-sheet"
import { QuoteDetailSheet } from "@/components/quotes/quote-detail-sheet"
import { ReportDetailSheet } from "@/components/reports/report-detail-sheet"
import { MinutaDetailSheet } from "@/components/minutes/minuta-detail-sheet"
import { ClientMeetingDetailSheet } from "@/components/client-meetings/client-meeting-detail-sheet"

interface ProjectDetailSheetProps {
    project: Project
}

export function ProjectDetailSheet({ project }: ProjectDetailSheetProps) {
    const status = project.status;
    const variant = status === "Completado" ? "secondary" : "default";

    const [relatedData, setRelatedData] = useState<{
        tasks: Task[];
        incidents: Incident[];
        surveys: Survey[];
        quotes: Quote[];
        reports: Report[];
        minutas: Minuta[];
        clientMeetings: ClientMeeting[];
    } | null>(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Ensure ID is number if DB uses numbers, or keep string if UUID. 
                // Based on types types/index.ts, Project.id is string but referenced as number elsewhere?
                // Checking previous files: "id: number" in setup_modules for tables, but "id: string" in index.ts Project type.
                // Assuming implicit cast works or fixing type. Let's try casting to number if it looks numeric.
                const pid = Number(project.id);
                if (!isNaN(pid)) {
                    const data = await getProjectDetails(pid);
                    setRelatedData({
                        tasks: data.tasks as unknown as Task[],
                        incidents: data.incidents as unknown as Incident[],
                        surveys: data.surveys as unknown as Survey[],
                        quotes: data.quotes as unknown as Quote[],
                        reports: data.reports as unknown as Report[],
                        minutas: data.minutas as unknown as Minuta[],
                        clientMeetings: data.clientMeetings as unknown as ClientMeeting[],
                    });
                }
            } catch (error) {
                console.error("Failed to load project details", error);
            } finally {
                setLoading(false);
            }
        }

        if (project.id) {
            fetchData();
        }
    }, [project.id]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-blue-400">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Detalles</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-slate-900 border-slate-800 text-white overflow-y-auto pl-8 pr-8">
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-white text-xl flex items-center gap-2">
                        {project.nombre}
                        <Badge variant={variant} className="ml-2">{project.status}</Badge>
                    </SheetTitle>
                    <SheetDescription className="text-slate-400">
                        {project.ubicacion}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Información del Proyecto</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Cliente</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <User className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-200">{project.cliente}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Solicitante</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <User className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-200">{project.solicitante}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha Inicio</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-200">
                                        {project.fecha_inicio ? new Date(project.fecha_inicio.split('T')[0] + 'T00:00:00').toLocaleDateString("es-MX") : "-"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Fecha Fin</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-200">
                                        {project.fecha_fin ? new Date(project.fecha_fin.split('T')[0] + 'T00:00:00').toLocaleDateString("es-MX") : "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" /> Tareas Vinculadas
                        </h4>
                        {loading ? <p className="text-xs text-slate-500">Cargando...</p> : (
                            relatedData?.tasks && relatedData.tasks.length > 0 ? (
                                <div className="space-y-2">
                                    {relatedData.tasks.map(task => (
                                        <TaskDetailSheet
                                            key={task.id}
                                            task={task}
                                            trigger={
                                                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 hover:border-slate-700 transition-all">
                                                    <div className="text-sm text-slate-300">{task.titulo || task.descripcion}</div>
                                                    <Badge variant="outline" className="text-xs scale-90">{task.estatus || "Pendiente"}</Badge>
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-500 italic">No hay tareas vinculadas.</p>
                        )}
                    </div>

                    {/* Incidents */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" /> Incidencias
                        </h4>
                        {loading ? <p className="text-xs text-slate-500">Cargando...</p> : (
                            relatedData?.incidents && relatedData.incidents.length > 0 ? (
                                <div className="space-y-2">
                                    {relatedData.incidents.map(inc => (
                                        <IncidentDetailSheet
                                            key={inc.id}
                                            incident={inc}
                                            trigger={
                                                <div className="bg-slate-950 p-2 rounded border border-slate-800 cursor-pointer hover:bg-slate-900 hover:border-slate-700 transition-all">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-white font-medium">{inc.titulo}</span>
                                                        <Badge className={inc.severidad === 'Crítica' ? 'bg-red-900 text-red-200' : 'bg-slate-800 text-slate-400'}>{inc.severidad}</Badge>
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">{inc.estatus}</div>
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-500 italic">No hay incidencias registradas.</p>
                        )}
                    </div>

                    {/* Surveys */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-blue-500" /> Levantamientos
                        </h4>
                        {loading ? <p className="text-xs text-slate-500">Cargando...</p> : (
                            relatedData?.surveys && relatedData.surveys.length > 0 ? (
                                <div className="space-y-2">
                                    {relatedData.surveys.map(item => (
                                        <div key={item.id} className="relative group">
                                            <SurveyDetailSheet
                                                survey={item as any}
                                                project={project}
                                                trigger={
                                                    <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 hover:border-slate-700 transition-all">
                                                        <div>
                                                            <div className="text-sm text-slate-300">Folio: {item.folio}</div>
                                                            <div className="text-xs text-slate-500">{item.fecha_visita ? new Date(item.fecha_visita.split('T')[0] + 'T00:00:00').toLocaleDateString() : 'Sin fecha'}</div>
                                                        </div>
                                                        {item.pdf_final_url && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 text-xs absolute right-2 z-10"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(item.pdf_final_url!, '_blank')
                                                                }}
                                                            >
                                                                PDF
                                                            </Button>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-500 italic">No hay levantamientos.</p>
                        )}
                    </div>

                    {/* Quotes */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-orange-500" /> Cotizaciones
                        </h4>
                        {loading ? <p className="text-xs text-slate-500">Cargando...</p> : (
                            relatedData?.quotes && relatedData.quotes.length > 0 ? (
                                <div className="space-y-2">
                                    {relatedData.quotes.map(quote => (
                                        <QuoteDetailSheet
                                            key={quote.id}
                                            quote={quote as any}
                                            project={project}
                                            trigger={
                                                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 hover:border-slate-700 transition-all">
                                                    <div>
                                                        <div className="text-sm text-slate-300">{quote.folio}</div>
                                                        <div className="text-xs text-emerald-400 font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(quote.total)}</div>
                                                    </div>
                                                    <Badge variant="outline">{quote.estatus}</Badge>
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-500 italic">No hay cotizaciones.</p>
                        )}
                    </div>

                    {/* Reports */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-500" /> Reportes
                        </h4>
                        {loading ? <p className="text-xs text-slate-500">Cargando...</p> : (
                            relatedData?.reports && relatedData.reports.length > 0 ? (
                                <div className="space-y-2">
                                    {relatedData.reports.map(rep => (
                                        <div key={rep.id} className="relative group">
                                            <ReportDetailSheet
                                                report={rep as any}
                                                project={project}
                                                trigger={
                                                    <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 hover:border-slate-700 transition-all">
                                                        <div className="text-sm text-slate-300">{rep.resumen_titulo}</div>
                                                        {rep.pdf_final_url && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 text-xs absolute right-2 z-10"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(rep.pdf_final_url!, '_blank')
                                                                }}
                                                            >
                                                                PDF
                                                            </Button>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-500 italic">No hay reportes.</p>
                        )}
                    </div>

                    {/* Minutas */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-indigo-500" /> Minutas
                        </h4>
                        {loading ? <p className="text-xs text-slate-500">Cargando...</p> : (
                            relatedData?.minutas && relatedData.minutas.length > 0 ? (
                                <div className="space-y-2">
                                    {relatedData.minutas.map(minuta => (
                                        <div key={minuta.id} className="relative group">
                                            <MinutaDetailSheet
                                                minuta={minuta}
                                                defaultProjectId={Number(project.id)}
                                                readonly={true}
                                                trigger={
                                                    <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 hover:border-slate-700 transition-all">
                                                        <div>
                                                            <div className="text-sm text-slate-300">{minuta.titulo}</div>
                                                            <div className="text-xs text-slate-500">{minuta.fecha ? new Date(minuta.fecha.split('T')[0] + 'T00:00:00').toLocaleDateString("es-MX", { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}</div>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs scale-90">Minuta</Badge>
                                                    </div>
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-500 italic">No hay minutas registradas.</p>
                        )}
                    </div>

                    {/* Client Meetings */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <Users className="h-4 w-4 text-rose-500" /> Reuniones con Clientes
                        </h4>
                        {loading ? <p className="text-xs text-slate-500">Cargando...</p> : (
                            relatedData?.clientMeetings && relatedData.clientMeetings.length > 0 ? (
                                <div className="space-y-2">
                                    {relatedData.clientMeetings.map(meeting => (
                                        <div key={meeting.id} className="relative group">
                                            <ClientMeetingDetailSheet
                                                meeting={meeting}
                                                defaultProjectId={Number(project.id)}
                                                readonly={true}
                                                trigger={
                                                    <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 hover:border-slate-700 transition-all">
                                                        <div>
                                                            <div className="text-sm text-slate-300">{meeting.titulo}</div>
                                                            <div className="text-xs text-slate-500">{meeting.fecha ? new Date(meeting.fecha.split('T')[0] + 'T00:00:00').toLocaleDateString("es-MX", { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}</div>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs scale-90">Reunión</Badge>
                                                    </div>
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-500 italic">No hay reuniones registradas.</p>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
