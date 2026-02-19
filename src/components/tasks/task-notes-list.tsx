"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Nota } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronDown, Eye, FileText, ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface TaskNotesListProps {
    taskId: number
}

export function TaskNotesList({ taskId }: TaskNotesListProps) {
    const [notes, setNotes] = useState<Nota[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

    useEffect(() => {
        const fetchNotes = async () => {
            setIsLoading(true)
            const supabase = createClient()
            const { data } = await supabase
                .from("notas")
                .select("*")
                .eq("tarea_id", taskId)
                .order("fecha", { ascending: false })

            if (data) {
                setNotes(data as Nota[])
            }
            setIsLoading(false)
        }

        if (taskId) {
            fetchNotes()
        }
    }, [taskId])

    if (isLoading) {
        return <div className="text-sm text-slate-500">Cargando notas...</div>
    }

    if (notes.length === 0) {
        return (
            <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-200 italic">
                No hay notas asociadas a esta tarea.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Notas Asociadas
                <span className="text-xs bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5">{notes.length}</span>
            </h4>
            <div className="space-y-2">
                {notes.map((note) => {
                    const isExpanded = expandedNoteId === note.id
                    return (
                        <div key={note.id} className="bg-white rounded-md border border-slate-200 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                                className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="flex-1 min-w-0 mr-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-medium text-slate-900 truncate">{note.titulo}</span>
                                        {note.url_imagenes && note.url_imagenes.length > 0 && (
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-slate-200 text-slate-500 flex items-center gap-1">
                                                <ImageIcon className="h-3 w-3" />
                                                {note.url_imagenes.length}
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-500 block">
                                        {format(new Date(note.fecha), "PPP", { locale: es })} • {note.autor}
                                    </span>
                                </div>
                                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>

                            {isExpanded && (
                                <div className="px-3 pb-3 pt-1 border-t border-slate-200 bg-slate-50/50 animate-in slide-in-from-top-1 duration-200">
                                    {note.contenido && (
                                        <div className="prose prose-sm max-w-none text-slate-700 text-xs mb-3 whitespace-pre-wrap">
                                            {note.contenido}
                                        </div>
                                    )}

                                    {note.url_imagenes && note.url_imagenes.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                            {note.url_imagenes.map((url, idx) => (
                                                <div key={idx} className="relative group aspect-square bg-slate-100 rounded border border-slate-200 overflow-hidden">
                                                    <Image
                                                        src={url}
                                                        alt={`Imagen nota ${idx + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                window.open(url, '_blank')
                                                            }}
                                                            className="h-7 text-[10px] px-2"
                                                        >
                                                            <Eye className="mr-1.5 h-3 w-3" />
                                                            Ver
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
