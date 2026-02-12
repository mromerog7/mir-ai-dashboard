"use client"

import { createClient } from "@/lib/supabase/client"
import { columns, Report } from "./columns";
import { DataTable } from "@/app/(dashboard)/projects/data-table";
import { Button } from "@/components/ui/button";
import { EditReportSheet } from "@/components/reports/edit-report-sheet";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ReportsClientProps {
    initialReports: Report[];
}

export function ReportsClient({ initialReports }: ReportsClientProps) {
    const [reports, setReports] = useState<Report[]>(initialReports);
    const router = useRouter();

    useEffect(() => {
        setReports(initialReports);
    }, [initialReports]);

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
                            .select("*, proyectos(nombre)")
                            .eq('id', payload.new.id)
                            .single();
                        if (data) setReports((prev) => [data as Report, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('reportes')
                            .select("*, proyectos(nombre)")
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Reportes</h1>
                <EditReportSheet
                    trigger={
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Reporte
                        </Button>
                    }
                />
            </div>

            <DataTable
                columns={columns}
                data={reports}
            />
        </div>
    );
}
