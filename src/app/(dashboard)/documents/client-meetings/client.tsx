"use client"

import { createClient } from "@/lib/supabase/client"
import { columns } from "./columns"
import { DataTable } from "@/app/(dashboard)/projects/data-table"
import { Button } from "@/components/ui/button"
import { ClientMeetingDetailSheet } from "@/components/client-meetings/client-meeting-detail-sheet"
import { Plus, FolderOpen } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ClientMeeting } from "@/types"

interface Project {
    id: number
    nombre: string
}

interface ClientMeetingsClientProps {
    initialMeetings: ClientMeeting[]
    projects: Project[]
}

export function ClientMeetingsClient({ initialMeetings, projects }: ClientMeetingsClientProps) {
    const [meetings, setMeetings] = useState<ClientMeeting[]>(initialMeetings)
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
    const router = useRouter()

    useEffect(() => {
        setMeetings(initialMeetings)
    }, [initialMeetings])

    // Realtime subscription
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('realtime-client-meetings')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reuniones_clientes' },
                async (payload) => {
                    console.log("[ClientMeetingsClient] Change received:", payload)
                    router.refresh()

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('reuniones_clientes')
                            .select("*, proyectos(nombre)")
                            .eq('id', payload.new.id)
                            .single()

                        if (data) {
                            if (payload.eventType === 'INSERT') {
                                setMeetings(prev => [data as ClientMeeting, ...prev])
                            } else {
                                setMeetings(prev => prev.map(m => m.id === payload.new.id ? (data as ClientMeeting) : m))
                            }
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setMeetings(prev => prev.filter(m => m.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

    // Filter logic
    const filteredMeetings = useMemo(() => {
        if (selectedProjectId === "all") return meetings
        return meetings.filter(m => m.proyecto_id?.toString() === selectedProjectId)
    }, [meetings, selectedProjectId])

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Reunión con Clientes</h2>
                    <p className="text-muted-foreground text-slate-400">
                        Registro de reuniones con clientes, acuerdos y seguimiento.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* Project Filter */}
                    <div className="relative flex items-center">
                        <FolderOpen className="absolute left-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-md pl-8 pr-8 py-2 appearance-none cursor-pointer hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Todas las reuniones</option>
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

                    <ClientMeetingDetailSheet
                        trigger={
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Reunión
                            </Button>
                        }
                    />
                </div>
            </div>
            <DataTable
                data={filteredMeetings}
                columns={columns}
            />
        </div>
    )
}
