"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, CheckCircle, Clock, Pencil, FolderOpen } from "lucide-react"
import { IncidentDetailSheet } from "@/components/incidents/incident-detail-sheet"
import { Incident } from "@/types"
import { EditIncidentSheet } from "@/components/incidents/edit-incident-sheet"
import { CloseIncidentSheet } from "@/components/incidents/close-incident-sheet"

interface Project {
    id: number;
    nombre: string;
}

interface IncidentsViewProps {
    initialIncidents: Incident[]
}

export function IncidentsView({ initialIncidents }: IncidentsViewProps) {
    const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all")

    useEffect(() => {
        setIncidents(initialIncidents)
    }, [initialIncidents])

    useEffect(() => {
        const fetchProjects = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("proyectos")
                .select("id, nombre")
                .order("nombre", { ascending: true });
            if (data) setProjects(data);
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('realtime-incidents')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'incidencias' },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const { data } = await supabase
                            .from('incidencias')
                            .select('*, proyectos(nombre, cliente, ubicacion), incidencia_tareas(tarea_id, tareas(titulo))')
                            .eq('id', payload.new.id)
                            .single()
                        if (data) setIncidents((prev) => [data as unknown as Incident, ...prev])
                    } else if (payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('incidencias')
                            .select('*, proyectos(nombre, cliente, ubicacion), incidencia_tareas(tarea_id, tareas(titulo))')
                            .eq('id', payload.new.id)
                            .single()
                        if (data) setIncidents((prev) => prev.map((i) => i.id === payload.new.id ? (data as unknown as Incident) : i))
                    } else if (payload.eventType === 'DELETE') {
                        setIncidents((prev) => prev.filter((i) => i.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const filteredIncidents = useMemo(() => {
        if (selectedProjectId === "all") return incidents;
        return incidents.filter(i => i.proyecto_id?.toString() === selectedProjectId);
    }, [incidents, selectedProjectId]);

    const severityColors: Record<string, string> = {
        "Baja": "border-blue-500/50 hover:border-blue-500",
        "Media": "border-yellow-500/50 hover:border-yellow-500",
        "Alta": "border-orange-500/50 hover:border-orange-500",
        "Crítica": "border-red-500/50 hover:border-red-500",
    }

    const severityTextColors: Record<string, string> = {
        "Baja": "text-blue-500",
        "Media": "text-yellow-500",
        "Alta": "text-orange-500",
        "Crítica": "text-red-500",
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Centro de Riesgos (Incidencias)</h1>
                <div className="flex items-center space-x-3">
                    {/* Project Filter */}
                    <div className="relative flex items-center">
                        <FolderOpen className="absolute left-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-md pl-8 pr-8 py-1.5 appearance-none cursor-pointer hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Todos los proyectos</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id.toString()}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                        <svg className="absolute right-2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <EditIncidentSheet />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIncidents.map((incident) => (
                    <Card key={incident.id} className={`bg-slate-800 text-white transition-all duration-300 border-l-4 ${incident.estatus === "Resuelta" ? "border-slate-500" : (severityColors[incident.severidad] || "border-slate-700")} flex flex-col`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className={`${incident.estatus === "Resuelta" ? "text-slate-500 border-slate-500" : (severityTextColors[incident.severidad] || "text-white")} border-current`}>
                                    {incident.severidad}
                                </Badge>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2">
                                        {incident.estatus === "Resuelta" ? (
                                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">Resuelta</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Abierta</Badge>
                                        )}
                                        <EditIncidentSheet
                                            incident={incident as unknown as Incident}
                                            trigger={
                                                <button className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700">
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                            }
                                        />
                                    </div>
                                    {incident.estatus !== "Resuelta" && (
                                        <CloseIncidentSheet incident={incident as unknown as Incident} />
                                    )}
                                </div>
                            </div>
                            <CardTitle className="text-lg font-semibold mt-2">{incident.titulo}</CardTitle>
                            <p className="text-sm text-slate-400">{incident.proyectos?.nombre}</p>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            <p className="text-sm text-slate-300 line-clamp-3 mb-4 flex-1">{incident.descripcion}</p>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
                                <div className="flex items-center">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Costo: {incident.impacto_costo ? `$${incident.impacto_costo}` : "N/A"}
                                </div>
                                <div className="flex items-center">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Tiempo: {incident.impacto_tiempo || "N/A"}
                                </div>
                            </div>

                            {incident.estatus === "Resuelta" && incident.solucion_final && (
                                <div className="mt-4 mb-4 p-3 bg-blue-900/20 border border-blue-900/50 rounded-md">
                                    <h4 className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Solución
                                    </h4>
                                    <p className="text-sm text-blue-100/80 italic">{incident.solucion_final}</p>
                                </div>
                            )}

                            <div className="text-xs text-slate-500 mb-4 flex justify-between items-center">
                                <span>Registrado: {format(new Date(incident.fecha_inicio.split('T')[0] + 'T00:00:00'), "PPP", { locale: es })}</span>
                                {incident.fecha_cierre && (
                                    <span className="text-blue-500">
                                        Cierre: {format(
                                            (() => {
                                                const datePart = incident.fecha_cierre!.split('T')[0];
                                                const [year, month, day] = datePart.split('-').map(Number);
                                                return new Date(year, month - 1, day, 12, 0, 0);
                                            })(),
                                            "d 'de' MMMM 'de' yyyy", { locale: es }
                                        )}
                                    </span>
                                )}
                            </div>

                            <IncidentDetailSheet incident={incident as unknown as Incident} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
