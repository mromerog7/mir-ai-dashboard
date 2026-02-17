"use client"

import { createClient } from "@/lib/supabase/client"
import { columns } from "./columns"
import { DataTable } from "@/app/(dashboard)/projects/data-table"
import { Button } from "@/components/ui/button"
import { MinutaDetailSheet } from "@/components/minutes/minuta-detail-sheet"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Minuta } from "@/types"

interface MinutesClientProps {
    initialMinutes: Minuta[]
}

export function MinutesClient({ initialMinutes }: MinutesClientProps) {
    const [minutes, setMinutes] = useState<Minuta[]>(initialMinutes)
    const router = useRouter()

    useEffect(() => {
        setMinutes(initialMinutes)
    }, [initialMinutes])

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('realtime-minutas')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'minutas' },
                async (payload) => {
                    console.log("[MinutesClient] Change received:", payload)
                    router.refresh()

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('minutas')
                            .select("*, proyectos(nombre)")
                            .eq('id', payload.new.id)
                            .single()

                        if (data) {
                            if (payload.eventType === 'INSERT') {
                                setMinutes(prev => [data as Minuta, ...prev])
                            } else {
                                setMinutes(prev => prev.map(m => m.id === payload.new.id ? (data as Minuta) : m))
                            }
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setMinutes(prev => prev.filter(m => m.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Minutas</h2>
                    <p className="text-muted-foreground text-slate-400">
                        Registro de reuniones, acuerdos y pendientes.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <MinutaDetailSheet
                        trigger={
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Minuta
                            </Button>
                        }
                    />
                </div>
            </div>
            <DataTable
                data={minutes}
                columns={columns}
            />
        </div>
    )
}
