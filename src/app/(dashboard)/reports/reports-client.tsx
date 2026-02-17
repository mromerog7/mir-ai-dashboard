"use client"

import { createClient } from "@/lib/supabase/client"
import { columns, Report } from "./columns";
import { DataTable } from "@/app/(dashboard)/projects/data-table";
import { Button } from "@/components/ui/button";
import { EditReportSheet } from "@/components/reports/edit-report-sheet";
import { Plus } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";

interface Project {
    id: number;
    nombre: string;
}

interface ReportsClientProps {
    initialReports: Report[];
}

export function ReportsClient({ initialReports }: ReportsClientProps) {
    const [reports, setReports] = useState<Report[]>(initialReports);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
    const router = useRouter();

    useEffect(() => {
        setReports(initialReports);
    }, [initialReports]);

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
        const supabase = createClient();
        const channel = supabase
            .channel('realtime-reports')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reportes' },
                async (payload) => {
                    console.log("[ReportsClient] Change received:", payload);
                    if (payload.eventType === 'INSERT') {
                        const { data } = await supabase
                            .from('reportes')
                            .select("*, proyectos(nombre, cliente, ubicacion)")
                            .eq('id', payload.new.id)
                            .single();
                        if (data) setReports((prev) => [data as Report, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('reportes')
                            .select("*, proyectos(nombre, cliente, ubicacion)")
                            .eq('id', payload.new.id)
                            .single();
                        if (data) setReports((prev) => prev.map((r) => r.id === payload.new.id ? (data as Report) : r));
                    } else if (payload.eventType === 'DELETE') {
                        setReports((prev) => prev.filter((r) => r.id !== payload.old.id));
                    }
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    const filteredReports = useMemo(() => {
        if (selectedProjectId === "all") return reports;
        return reports.filter(r => r.proyecto_id?.toString() === selectedProjectId);
    }, [reports, selectedProjectId]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Reportes</h1>
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
                    <EditReportSheet
                        trigger={
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Reporte
                            </Button>
                        }
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredReports}
            />
        </div>
    );
}
