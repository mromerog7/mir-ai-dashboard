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
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-[#02457A]">Proyectos</h1>
                <CreateProjectButton />
            </div>

            <DataTable columns={columns} data={projects || []} />
        </div>
    );
}
