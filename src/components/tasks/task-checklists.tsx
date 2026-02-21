"use client"

import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckSquare, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Checklist {
    id: number
    tarea_id: number
    nombre: string
    items: ChecklistItem[]
}

interface ChecklistItem {
    id: number
    checklist_id: number
    texto: string
    completado: boolean
    posicion: number
}

// Pending types for new-task mode (local only, no DB IDs)
export interface PendingChecklist {
    tempId: number
    nombre: string
    items: { tempId: number; texto: string }[]
}

export interface TaskChecklistsHandle {
    getPendingChecklists: () => PendingChecklist[]
}

interface TaskChecklistsProps {
    taskId?: number | null  // null = pending mode (new task)
    readOnly?: boolean
}

let _tempIdCounter = 0
function nextTempId() { return --_tempIdCounter }

export const TaskChecklists = forwardRef<TaskChecklistsHandle, TaskChecklistsProps>(
    function TaskChecklists({ taskId, readOnly }, ref) {
        // DB-backed state
        const [checklists, setChecklists] = useState<Checklist[]>([])
        const [isLoading, setIsLoading] = useState(!!taskId)

        // Pending state (new-task mode)
        const [pendingChecklists, setPendingChecklists] = useState<PendingChecklist[]>([])

        const [newChecklistName, setNewChecklistName] = useState("")
        const [newItemTexts, setNewItemTexts] = useState<Record<number, string>>({})
        const [showNewChecklist, setShowNewChecklist] = useState(false)

        const isPending = !taskId

        // Expose pending data to parent
        useImperativeHandle(ref, () => ({
            getPendingChecklists: () => pendingChecklists,
        }), [pendingChecklists])

        // Fetch from DB when taskId exists
        const fetchChecklists = useCallback(async () => {
            if (!taskId) return
            const supabase = createClient()
            const { data: cls } = await supabase
                .from("tarea_checklists")
                .select("*")
                .eq("tarea_id", taskId)
                .order("created_at", { ascending: true })

            if (!cls) { setIsLoading(false); return }

            const withItems: Checklist[] = []
            for (const cl of cls) {
                const { data: items } = await supabase
                    .from("tarea_checklist_items")
                    .select("*")
                    .eq("checklist_id", cl.id)
                    .order("posicion", { ascending: true })
                withItems.push({ ...cl, items: items || [] })
            }
            setChecklists(withItems)
            setIsLoading(false)
        }, [taskId])

        useEffect(() => {
            if (taskId) fetchChecklists()
        }, [taskId, fetchChecklists])

        // ---- ADD CHECKLIST ----
        const addChecklist = async () => {
            const name = newChecklistName.trim()
            if (!name) return

            if (isPending) {
                setPendingChecklists(prev => [...prev, { tempId: nextTempId(), nombre: name, items: [] }])
            } else {
                const supabase = createClient()
                await supabase.from("tarea_checklists").insert({ tarea_id: taskId, nombre: name })
                fetchChecklists()
            }
            setNewChecklistName("")
            setShowNewChecklist(false)
        }

        // ---- DELETE CHECKLIST ----
        const deleteChecklist = async (id: number) => {
            if (isPending) {
                setPendingChecklists(prev => prev.filter(c => c.tempId !== id))
            } else {
                const supabase = createClient()
                await supabase.from("tarea_checklists").delete().eq("id", id)
                fetchChecklists()
            }
        }

        // ---- ADD ITEM ----
        const addItem = async (checklistId: number) => {
            const text = (newItemTexts[checklistId] || "").trim()
            if (!text) return

            if (isPending) {
                setPendingChecklists(prev =>
                    prev.map(c =>
                        c.tempId === checklistId
                            ? { ...c, items: [...c.items, { tempId: nextTempId(), texto: text }] }
                            : c
                    )
                )
            } else {
                const supabase = createClient()
                const maxPos = checklists.find(c => c.id === checklistId)?.items.length || 0
                await supabase.from("tarea_checklist_items").insert({
                    checklist_id: checklistId,
                    texto: text,
                    posicion: maxPos,
                })
                fetchChecklists()
            }
            setNewItemTexts(prev => ({ ...prev, [checklistId]: "" }))
        }

        // ---- TOGGLE ITEM ----
        const toggleItem = async (itemId: number, currentValue: boolean) => {
            if (readOnly) return
            const supabase = createClient()
            await supabase.from("tarea_checklist_items").update({ completado: !currentValue }).eq("id", itemId)
            setChecklists(prev =>
                prev.map(cl => ({
                    ...cl,
                    items: cl.items.map(it => it.id === itemId ? { ...it, completado: !currentValue } : it),
                }))
            )
        }

        // ---- DELETE ITEM ----
        const deleteItem = async (itemId: number) => {
            if (isPending) {
                setPendingChecklists(prev =>
                    prev.map(c => ({ ...c, items: c.items.filter(i => i.tempId !== itemId) }))
                )
            } else {
                const supabase = createClient()
                await supabase.from("tarea_checklist_items").delete().eq("id", itemId)
                setChecklists(prev =>
                    prev.map(cl => ({
                        ...cl,
                        items: cl.items.filter(it => it.id !== itemId),
                    }))
                )
            }
        }

        if (isLoading) {
            return <div className="text-sm text-slate-500">Cargando checklists...</div>
        }

        // Unified render data
        const renderData = isPending
            ? pendingChecklists.map(c => ({
                key: c.tempId,
                nombre: c.nombre,
                items: c.items.map(i => ({ key: i.tempId, texto: i.texto, completado: false })),
                total: c.items.length,
                done: 0,
            }))
            : checklists.map(c => ({
                key: c.id,
                nombre: c.nombre,
                items: c.items.map(i => ({ key: i.id, texto: i.texto, completado: i.completado })),
                total: c.items.length,
                done: c.items.filter(i => i.completado).length,
            }))

        return (
            <div className="space-y-3 border border-slate-200 rounded-md p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-violet-600" />
                        Checklists
                        {renderData.length > 0 && (
                            <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">
                                {renderData.length}
                            </span>
                        )}
                    </h4>
                    {!readOnly && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                            onClick={() => setShowNewChecklist(true)}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo
                        </Button>
                    )}
                </div>

                {/* New checklist input */}
                {showNewChecklist && (
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Nombre del checklist..."
                            value={newChecklistName}
                            onChange={e => setNewChecklistName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addChecklist()}
                            className="h-8 text-sm bg-white border-slate-200"
                            autoFocus
                        />
                        <Button type="button" size="sm" className="h-8 bg-violet-600 hover:bg-violet-700 text-xs px-3" onClick={addChecklist}>
                            Crear
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setShowNewChecklist(false); setNewChecklistName("") }}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}

                {/* Checklist list */}
                {renderData.map(cl => {
                    const pct = cl.total > 0 ? Math.round((cl.done / cl.total) * 100) : 0

                    return (
                        <div key={cl.key} className="bg-white rounded-md border border-slate-200 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 border-b border-slate-100">
                                <span className="text-sm font-medium text-slate-800">{cl.nombre}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-medium">{cl.done}/{cl.total}</span>
                                    {!readOnly && (
                                        <button
                                            type="button"
                                            onClick={() => deleteChecklist(cl.key)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                            title="Eliminar checklist"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Progress bar */}
                            {cl.total > 0 && (
                                <div className="h-1 bg-slate-100">
                                    <div
                                        className="h-full bg-violet-500 transition-all duration-300"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            )}

                            {/* Items */}
                            <div className="divide-y divide-slate-100">
                                {cl.items.map(item => (
                                    <div key={item.key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50/50 group">
                                        <input
                                            type="checkbox"
                                            checked={item.completado}
                                            onChange={() => !isPending && toggleItem(item.key, item.completado)}
                                            disabled={readOnly || isPending}
                                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:cursor-default"
                                        />
                                        <span className={`text-sm flex-1 ${item.completado ? "line-through text-slate-400" : "text-slate-700"}`}>
                                            {item.texto}
                                        </span>
                                        {!readOnly && (
                                            <button
                                                type="button"
                                                onClick={() => deleteItem(item.key)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                                                title="Eliminar"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add item input */}
                            {!readOnly && (
                                <div className="px-3 py-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Agregar elemento..."
                                            value={newItemTexts[cl.key] || ""}
                                            onChange={e => setNewItemTexts(prev => ({ ...prev, [cl.key]: e.target.value }))}
                                            onKeyDown={e => e.key === "Enter" && addItem(cl.key)}
                                            className="h-7 text-xs bg-white border-slate-200 flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-violet-500 hover:text-violet-700 hover:bg-violet-50"
                                            onClick={() => addItem(cl.key)}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {renderData.length === 0 && !showNewChecklist && (
                    <p className="text-xs text-slate-500 italic">No hay checklists. {!readOnly && 'Presiona "Nuevo" para crear uno.'}</p>
                )}
            </div>
        )
    }
)
