import { createClient } from "@/lib/supabase/server";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { CreateProjectButton } from "@/components/projects/create-project-button";

export default async function ProjectsPage() {
    const supabase = await createClient();
    const { data: projects, error } = await supabase
        .from("proyectos")
        .select("*")
        .order("fecha_inicio", { ascending: false });

    if (error) {
        console.error("Error fetching projects:", error);
        return <div className="text-white">Error al cargar proyectos.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Proyectos</h1>
                <CreateProjectButton />
            </div>

            <DataTable columns={columns} data={projects || []} />
        </div>
    );
}
