import { createClient } from "@/lib/supabase/server";
import { Quote } from "./columns";
import { QuotesClient } from "./quotes-client";

export default async function QuotesPage() {
    const supabase = await createClient();

    // Fetch quotes
    const { data: quotes, error } = await supabase
        .from("cotizaciones")
        .select("id, folio, cliente, subtotal, iva, total, estatus, fecha_emision, pdf_url, ubicacion, items_json, proyecto_id, solicitante, requiere_factura, proyectos(nombre, ubicacion, solicitante)")
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <div className="p-4 space-y-4">
                <h1 className="text-3xl font-bold text-white tracking-tight">Cotizaciones</h1>
                <div className="text-slate-400">
                    <p>No se pudieron cargar las cotizaciones.</p>
                    <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-red-400">{error.message}</pre>
                </div>
            </div>
        );
    }

    return (
        <QuotesClient initialQuotes={(quotes as unknown as Quote[]) || []} />
    );
}
