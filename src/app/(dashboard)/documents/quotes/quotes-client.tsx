"use client"

import { createClient } from "@/lib/supabase/client"
import { columns, Quote } from "./columns";
import { DataTable } from "@/app/(dashboard)/projects/data-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditQuoteSheet } from "@/components/quotes/edit-quote-sheet";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface QuotesClientProps {
    initialQuotes: Quote[];
}

export function QuotesClient({ initialQuotes }: QuotesClientProps) {
    const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
    const router = useRouter();

    useEffect(() => {
        setQuotes(initialQuotes);
    }, [initialQuotes]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('realtime-quotes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'cotizaciones' },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const { data } = await supabase
                            .from('cotizaciones')
                            .select("id, folio, cliente, subtotal, iva, total, estatus, fecha_emision, pdf_url, ubicacion, items_json, proyecto_id, solicitante, requiere_factura, proyectos(nombre, ubicacion, solicitante)")
                            .eq('id', payload.new.id)
                            .single();
                        if (data) setQuotes((prev) => [data as unknown as Quote, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('cotizaciones')
                            .select("id, folio, cliente, subtotal, iva, total, estatus, fecha_emision, pdf_url, ubicacion, items_json, proyecto_id, solicitante, requiere_factura, proyectos(nombre, ubicacion, solicitante)")
                            .eq('id', payload.new.id)
                            .single();
                        if (data) setQuotes((prev) => prev.map((q) => q.id === payload.new.id ? (data as unknown as Quote) : q));
                    } else if (payload.eventType === 'DELETE') {
                        setQuotes((prev) => prev.filter((q) => q.id !== payload.old.id));
                    }
                    router.refresh(); // Refresh server components as well (optional but good for consistency)
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
                <h1 className="text-3xl font-bold text-white tracking-tight">Cotizaciones</h1>
                <EditQuoteSheet
                    trigger={
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Cotización
                        </Button>
                    }
                />
            </div>

            <DataTable columns={columns} data={quotes} />
        </div>
    );
}
