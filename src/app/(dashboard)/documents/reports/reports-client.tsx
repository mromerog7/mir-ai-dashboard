"use client"

import { createClient } from "@/lib/supabase/client"
import { PdfList } from "@/components/documents/pdf-list";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define a type that matches what PdfList expects / what Supabase returns
// Based on page.tsx: select("*, proyectos(nombre)")
interface Report {
    id: string; // or number, depends on DB. Usually UUID or Int. Let's assume consistent with others.
    fecha_reporte: string;
    resumen_titulo: string;
    // Add other fields as needed by PdfList, or use 'any' if strict typing isn't critical right now
    [key: string]: any;
}

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
        <PdfList title="Reportes de Actividad" items={reports} type="report" />
    );
}
