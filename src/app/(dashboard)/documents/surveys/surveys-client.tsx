"use client"

import { createClient } from "@/lib/supabase/client"
import { columns, Survey } from "./columns";
import { DataTable } from "@/app/(dashboard)/projects/data-table";
import { EditSurveySheet } from "@/components/surveys/edit-survey-sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SurveysClientProps {
    initialSurveys: Survey[];
}

export function SurveysClient({ initialSurveys }: SurveysClientProps) {
    const [surveys, setSurveys] = useState<Survey[]>(initialSurveys);
    const router = useRouter();

    useEffect(() => {
        setSurveys(initialSurveys);
    }, [initialSurveys]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('realtime-surveys')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'levantamientos' },
                async (payload) => {
                    console.log("[SurveysClient] Change received:", payload);
                    if (payload.eventType === 'INSERT') {
                        const { data } = await supabase
                            .from('levantamientos')
                            .select("*, proyectos(nombre, cliente, ubicacion)")
                            .eq('id', payload.new.id)
                            .single();
                        if (data) setSurveys((prev) => [data as unknown as Survey, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('levantamientos')
                            .select("*, proyectos(nombre, cliente, ubicacion)")
                            .eq('id', payload.new.id)
                            .single();
                        if (data) setSurveys((prev) => prev.map((s) => s.id === payload.new.id ? (data as unknown as Survey) : s));
                    } else if (payload.eventType === 'DELETE') {
                        setSurveys((prev) => prev.filter((s) => s.id !== payload.old.id));
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
                <h1 className="text-3xl font-bold text-white tracking-tight">Levantamientos</h1>
                <EditSurveySheet
                    trigger={
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Levantamiento
                        </Button>
                    }
                />
            </div>

            <DataTable columns={columns} data={surveys} />
        </div>
    );
}
