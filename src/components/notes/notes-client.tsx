"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Nota } from "@/types"
import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NoteSheet } from "./note-sheet"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function NotesClient() {
    const supabase = createClient()
    const [notas, setNotas] = useState<Nota[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedProject, setSelectedProject] = useState<string>("all")
    const [projects, setProjects] = useState<{ id: string; nombre: string }[]>([])

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [selectedNota, setSelectedNota] = useState<Nota | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    const fetchNotas = async () => {
        setIsLoading(true)
        let query = supabase
            .from("notas")
            .select(`
                *,
                proyectos (nombre),
                tareas (titulo)
            `)
            .order("fecha", { ascending: false })

        if (selectedProject !== "all") {
            if (selectedProject === "null") {
                query = query.is("proyecto_id", null)
            } else {
                query = query.eq("proyecto_id", parseInt(selectedProject))
            }
        }

        const { data, error } = await query

        if (error) {
            toast.error("Error al cargar notas")
            console.error(error)
        } else {
            setNotas((data as any) || [])
        }
        setIsLoading(false)
    }

    // Load initial data and projects
    useEffect(() => {
        const loadInitialData = async () => {
            const { data: projectsData } = await supabase.from("proyectos").select("id, nombre").order("nombre")
            if (projectsData) setProjects(projectsData as any)
            await fetchNotas()
        }
        loadInitialData()

            // Expose functions to window for dropdown actions
            (window as any).refreshNotas = fetchNotas;
        (window as any).openNoteSheet = (nota: Nota, editing: boolean) => {
            setSelectedNota(nota)
            setIsEditing(editing)
            setIsSheetOpen(true)
        };
        (window as any).deleteNote = async (id: string) => {
            if (confirm("¿Estás seguro de que deseas eliminar esta nota?")) {
                const { error } = await supabase.from("notas").delete().eq("id", id)
                if (error) {
                    toast.error("Error al eliminar nota")
                } else {
                    toast.success("Nota eliminada")
                    fetchNotas()
                }
            }
        }

        // Subscribe to realtime changes
        const channel = supabase
            .channel('notas_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notas' },
                () => {
                    fetchNotas()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            delete (window as any).refreshNotas
            delete (window as any).openNoteSheet
            delete (window as any).deleteNote
        }
    }, [])

    // Refetch when filter changes
    useEffect(() => {
        fetchNotas()
    }, [selectedProject])

    const handleNewNote = () => {
        setSelectedNota(null)
        setIsEditing(true)
        setIsSheetOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-[200px] bg-white border-slate-200">
                            <SelectValue placeholder="Filtrar por proyecto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los proyectos</SelectItem>
                            <SelectItem value="null">General (Sin proyecto)</SelectItem>
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleNewNote} className="bg-[#02457A] hover:bg-[#02345e] text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Nota
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                <DataTable
                    columns={columns}
                    data={notas}
                    filterColumn="titulo"
                    searchPlaceholder="Buscar notas..."
                />
            </div>

            <NoteSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                nota={selectedNota}
                isEditing={isEditing}
                onSaved={fetchNotas}
            />
        </div>
    )
}
