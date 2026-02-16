import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { IncidentDetailSheet } from "@/components/incidents/incident-detail-sheet";
import { Incident } from "@/types";
import { EditIncidentSheet } from "@/components/incidents/edit-incident-sheet";
import { CloseIncidentSheet } from "@/components/incidents/close-incident-sheet";

import { Pencil } from "lucide-react";

export default async function IncidentsPage() {
    const supabase = await createClient();
    const { data: incidents, error } = await supabase
        .from("incidencias")
        .select("*, proyectos(nombre, cliente, ubicacion), tareas(titulo)")
        .order("estatus", { ascending: true }) // Open first
        .order("severidad", { ascending: false }) // Show critical first
        .order("fecha_inicio", { ascending: false });

    if (error) {
        console.error("Error fetching incidents:", error);
        return <div className="text-white">Error al cargar incidencias.</div>;
    }

    const severityColors: Record<string, string> = {
        "Baja": "border-green-500/50 hover:border-green-500",
        "Media": "border-yellow-500/50 hover:border-yellow-500",
        "Alta": "border-orange-500/50 hover:border-orange-500",
        "Crítica": "border-red-500/50 hover:border-red-500",
    }

    const severityTextColors: Record<string, string> = {
        "Baja": "text-green-500",
        "Media": "text-yellow-500",
        "Alta": "text-orange-500",
        "Crítica": "text-red-500",
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Centro de Riesgos (Incidencias)</h1>
                <EditIncidentSheet />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {incidents?.map((incident) => (
                    <Card key={incident.id} className={`bg-slate-800 text-white transition-all duration-300 border-l-4 ${incident.estatus === "Resuelta" ? "border-slate-500" : (severityColors[incident.severidad] || "border-slate-700")} flex flex-col`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className={`${incident.estatus === "Resuelta" ? "text-slate-500 border-slate-500" : (severityTextColors[incident.severidad] || "text-white")} border-current`}>
                                    {incident.severidad}
                                </Badge>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2">
                                        {incident.estatus === "Resuelta" ? (
                                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Resuelta</Badge>
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
                                <div className="mt-4 mb-4 p-3 bg-green-900/20 border border-green-900/50 rounded-md">
                                    <h4 className="text-xs font-medium text-green-400 mb-1 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Solución
                                    </h4>
                                    <p className="text-sm text-green-100/80 italic">{incident.solucion_final}</p>
                                </div>
                            )}

                            <div className="text-xs text-slate-500 mb-4 flex justify-between items-center">
                                <span>Registrado: {format(new Date(incident.fecha_inicio.split('T')[0] + 'T00:00:00'), "PPP", { locale: es })}</span>
                                {incident.fecha_cierre && (
                                    <span className="text-green-500">
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
    );
}
