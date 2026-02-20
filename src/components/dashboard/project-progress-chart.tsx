import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"
import { CircularProgress } from "@/components/dashboard/circular-progress"

interface ProjectData {
    id: number
    nombre: string
    completionRate: number
    totalTasks: number
    completedTasks: number
}

interface ProjectProgressChartProps {
    projects: ProjectData[]
}

const GRADIENTS = [
    "blue-gradient",
    "purple-gradient",
    "orange-gradient",
    "green-gradient"
];

export function ProjectProgressChart({ projects }: ProjectProgressChartProps) {
    // Take top 5 projects for the best visual layout
    const displayProjects = projects.slice(0, 5);

    return (
        <Card className="col-span-1 shadow-sm border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-medium text-slate-800 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Avance de Proyectos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="min-h-[300px] w-full mt-4 flex flex-wrap items-center justify-center gap-6">
                    {displayProjects.length > 0 ? (
                        displayProjects.map((project, index) => (
                            <CircularProgress
                                key={project.id}
                                value={project.completionRate}
                                label={project.nombre.length > 15 ? `${project.nombre.substring(0, 15)}...` : project.nombre}
                                sublabel={`${project.completedTasks}/${project.totalTasks} Tareas`}
                                size={140}
                                strokeWidth={10}
                                gradientId={GRADIENTS[index % GRADIENTS.length]}
                            />
                        ))
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 text-sm">
                            <p>No hay proyectos activos con tareas.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
