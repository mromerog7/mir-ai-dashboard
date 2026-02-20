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
import { createClient } from "@/lib/supabase/client"
import { ProjectNotesList } from "./project-notes-list"
import { BudgetView } from "@/components/budgets/budget-view"
import { ExpensesView } from "@/app/(dashboard)/expenses/expenses-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet"
import { IncidentDetailSheet } from "@/components/incidents/incident-detail-sheet"
import { SurveyDetailSheet } from "@/components/surveys/survey-detail-sheet"
import { QuoteDetailSheet } from "@/components/quotes/quote-detail-sheet"
import { ReportDetailSheet } from "@/components/reports/report-detail-sheet"
import { MinutaDetailSheet } from "@/components/minutes/minuta-detail-sheet"
import { ClientMeetingDetailSheet } from "@/components/client-meetings/client-meeting-detail-sheet"
import { TaskProgressSummary } from "@/components/tasks/task-progress-summary"
import { CreateTaskButton } from "@/components/tasks/create-task-button"
import { TaskGantt } from "@/components/tasks/task-gantt"
import { TaskGanttReal } from "@/components/tasks/task-gantt-real"
import { DataTable } from "@/app/(dashboard)/tasks/data-table"
import { columns } from "@/app/(dashboard)/tasks/columns"
import { LayoutList, Clock } from "lucide-react"
import { TaskForm } from "@/components/tasks/task-form"


interface ProjectDetailSheetProps {
    project: Project
}

export function ProjectDetailSheet({ project }: ProjectDetailSheetProps) {
    const status = project.status;
    const variant = status === "Completado" ? "secondary" : "default";

    // Filter out the "proyecto" column for this view
    const projectColumns = columns.filter(col => col.id !== "proyecto");

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
    const [viewMode, setViewMode] = useState<"list" | "gantt" | "gantt_real">("list")
    const [editingTask, setEditingTask] = useState<Task | null>(null);


    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
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

    // Realtime subscription for Tasks
    useEffect(() => {
        if (!project.id) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`realtime-project-tasks-${project.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tareas',
                    filter: `proyecto_id=eq.${project.id}`
                },
                async (payload) => {
                    console.log("Realtime task event:", payload);

                    if (payload.eventType === 'INSERT') {
                        const { data } = await supabase
                            .from('tareas')
                            .select('*, proyectos(nombre)')
                            .eq('id', payload.new.id)
                            .single();

                        if (data) {
                            setRelatedData(prev => {
                                if (!prev) return null;
                                return {
                                    ...prev,
                                    tasks: [data as unknown as Task, ...prev.tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                };
                            });
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('tareas')
                            .select('*, proyectos(nombre)')
                            .eq('id', payload.new.id)
                            .single();

                        if (data) {
                            setRelatedData(prev => {
                                if (!prev) return null;
                                return {
                                    ...prev,
                                    tasks: prev.tasks.map(t => t.id === payload.new.id ? (data as unknown as Task) : t)
                                };
                            });
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setRelatedData(prev => {
                            if (!prev) return null;
                            return {
                                ...prev,
                                tasks: prev.tasks.filter(t => t.id !== payload.old.id)
                            };
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [project.id]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 text-blue-600">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Detalles</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[85vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-[#02457A] text-xl flex items-center gap-2">
                        {project.nombre}
                        <Badge variant={variant} className="ml-2">{project.status}</Badge>
                    </SheetTitle>
                    <SheetDescription className="text-slate-500 text-left">
                        {project.ubicacion}
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg mb-6">
                        <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:text-[#02457A] data-[state=active]:shadow-sm rounded-md transition-all">Información</TabsTrigger>
                        <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:text-[#02457A] data-[state=active]:shadow-sm rounded-md transition-all">Tareas</TabsTrigger>
                        <TabsTrigger value="gastos" className="data-[state=active]:bg-white data-[state=active]:text-[#02457A] data-[state=active]:shadow-sm rounded-md transition-all">Gastos</TabsTrigger>
                        <TabsTrigger value="presupuestos" className="data-[state=active]:bg-[#02457A] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">Presupuesto</TabsTrigger>
                    </TabsList>

                    {/* TAB: INFORMACIÓN */}
                    <TabsContent value="info" className="space-y-6 animate-in fade-in-50 focus-visible:outline-none">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2">Información del Proyecto</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-slate-500 block">Cliente</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-900 font-medium">{project.cliente}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block">Solicitante</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-900 font-medium">{project.solicitante}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block">Fecha Inicio</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-900 font-medium">
                                            {project.fecha_inicio ? new Date(project.fecha_inicio.split('T')[0] + 'T00:00:00').toLocaleDateString("es-MX") : "-"}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block">Fecha Fin</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm text-slate-900 font-medium">
                                            {project.fecha_fin ? new Date(project.fecha_fin.split('T')[0] + 'T00:00:00').toLocaleDateString("es-MX") : "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Project Notes */}
                        <ProjectNotesList projectId={Number(project.id)} />

                        {/* Incidents */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" /> Incidencias
                            </h4>
                            {loading ? <p className="text-xs text-slate-500">Cargando...</p> : (
                                relatedData?.incidents && relatedData.incidents.length > 0 ? (
                                    <div className="space-y-2">
                                        {relatedData.incidents.map(inc => (
                                            <IncidentDetailSheet
                                                key={inc.id}
                                                incident={inc}
                                                trigger={
                                                    <div className="bg-[#E5E5E5] p-2 rounded border border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-slate-900 font-medium">{inc.titulo}</span>
                                                            <Badge className={inc.severidad === 'Crítica' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-200 text-slate-600 border-slate-300'}>{inc.severidad}</Badge>
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
                            <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-blue-600" /> Levantamientos
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
                                                        <div className="bg-[#E5E5E5] p-2 rounded border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all">
                                                            <div>
                                                                <div className="text-sm text-slate-900 font-medium">Folio: {item.folio}</div>
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
                            <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-orange-600" /> Cotizaciones
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
                                                    <div className="bg-[#E5E5E5] p-2 rounded border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all">
                                                        <div>
                                                            <div className="text-sm text-slate-900 font-medium">{quote.folio}</div>
                                                            <div className="text-xs text-blue-600 font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(quote.total)}</div>
                                                        </div>
                                                        <Badge variant="outline" className="border-slate-300">{quote.estatus}</Badge>
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
                            <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-purple-600" /> Reportes
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
                                                        <div className="bg-[#E5E5E5] p-2 rounded border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all">
                                                            <div className="text-sm text-slate-900 font-medium">{rep.resumen_titulo}</div>
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
                            <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-indigo-600" /> Minutas
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
                                                        <div className="bg-[#E5E5E5] p-2 rounded border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all">
                                                            <div>
                                                                <div className="text-sm text-slate-900 font-medium">{minuta.titulo}</div>
                                                                <div className="text-xs text-slate-500">{minuta.fecha ? new Date(minuta.fecha.split('T')[0] + 'T00:00:00').toLocaleDateString("es-MX", { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}</div>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs scale-90 border-slate-300">Minuta</Badge>
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
                            <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                                <Users className="h-4 w-4 text-rose-600" /> Reuniones con Clientes
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
                                                        <div className="bg-[#E5E5E5] p-2 rounded border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all">
                                                            <div>
                                                                <div className="text-sm text-slate-900 font-medium">{meeting.titulo}</div>
                                                                <div className="text-xs text-slate-500">{meeting.fecha ? new Date(meeting.fecha.split('T')[0] + 'T00:00:00').toLocaleDateString("es-MX", { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}</div>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs scale-90 border-slate-300">Reunión</Badge>
                                                        </div>
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-slate-500 italic">No hay reuniones registradas.</p>
                            )}
                        </div>
                    </TabsContent>



                    {/* TAB: TAREAS */}
                    <TabsContent value="tasks" className="space-y-4 animate-in fade-in-50 focus-visible:outline-none">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-blue-600" /> Lista de Tareas
                            </h4>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                {/* View Switcher */}
                                <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-7 px-2 text-xs ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                                        onClick={() => setViewMode("list")}
                                        title="Lista"
                                    >
                                        <LayoutList className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-7 px-2 text-xs ${viewMode === "gantt" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                                        onClick={() => setViewMode("gantt")}
                                        title="Gantt Programado"
                                    >
                                        <Calendar className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-7 px-2 text-xs ${viewMode === "gantt_real" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                                        onClick={() => setViewMode("gantt_real")}
                                        title="Gantt Real vs Programado"
                                    >
                                        <Clock className="h-4 w-4" />
                                    </Button>
                                </div>

                                <CreateTaskButton defaultProjectId={Number(project.id)} />
                            </div>
                        </div>

                        {/* Task Progress Summary - Always visible */}
                        {relatedData?.tasks && relatedData.tasks.length > 0 && (
                            <TaskProgressSummary tasks={relatedData.tasks} />
                        )}

                        {loading ? <p className="text-xs text-slate-500">Cargando...</p> : (
                            relatedData?.tasks && relatedData.tasks.length > 0 ? (
                                <div className="min-h-[300px]">
                                    {viewMode === "list" && (
                                        <div className="border border-slate-200 rounded-md overflow-hidden">
                                            <DataTable columns={projectColumns} data={relatedData.tasks} />
                                        </div>
                                    )}

                                    {viewMode === "gantt" && (
                                        <div className="overflow-x-auto border border-slate-200 rounded-md bg-white p-4">
                                            <TaskGantt tasks={relatedData.tasks} onEditTask={setEditingTask} />
                                        </div>
                                    )}

                                    {viewMode === "gantt_real" && (
                                        <div className="overflow-x-auto border border-slate-200 rounded-md bg-white p-4">
                                            <TaskGanttReal tasks={relatedData.tasks} onEditTask={setEditingTask} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <p className="text-sm text-slate-500">No hay tareas vinculadas.</p>
                                </div>
                            )
                        )}
                    </TabsContent>

                    {/* TAB: GASTOS */}
                    <TabsContent value="gastos" className="h-[600px] animate-in fade-in-50 focus-visible:outline-none overflow-y-auto pr-2">
                        <ExpensesView projectId={Number(project.id)} />
                    </TabsContent>

                    {/* TAB: PRESUPUESTO */}
                    <TabsContent value="presupuestos" className="animate-in fade-in-50 focus-visible:outline-none">
                        <BudgetView projectId={Number(project.id)} />
                    </TabsContent>
                </Tabs>
            </SheetContent>

            {/* Edit Task Sheet */}
            <Sheet open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                    <SheetHeader>
                        <SheetTitle className="text-[#02457A]">Editar Tarea</SheetTitle>
                        <SheetDescription className="text-slate-500">
                            Modifica los detalles de la tarea.
                        </SheetDescription>
                    </SheetHeader>
                    {editingTask && (
                        <div className="py-4">
                            <TaskForm
                                onSuccess={() => setEditingTask(null)}
                                initialData={editingTask}
                                taskId={editingTask.id}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </Sheet>
    )
}
