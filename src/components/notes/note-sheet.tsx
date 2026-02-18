"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Nota, Project, Task } from "@/types"
import { toast } from "sonner"
import { Loader2, Trash2, Upload, X } from "lucide-react"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NoteSheetProps {
    isOpen: boolean
    onClose: () => void
    nota?: Nota | null
    isEditing: boolean
    onSaved: () => void
}

export function NoteSheet({ isOpen, onClose, nota, isEditing, onSaved }: NoteSheetProps) {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [date, setDate] = useState("")
    const [projectId, setProjectId] = useState<string>("0")
    const [taskId, setTaskId] = useState<string>("0")
    const [images, setImages] = useState<string[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [tasks, setTasks] = useState<Task[]>([]) // Filtered tasks for selected project

    // Fetch projects
    useEffect(() => {
        const fetchProjects = async () => {
            const { data } = await supabase.from("proyectos").select("*").order("nombre")
            if (data) setProjects(data)
        }
        fetchProjects()
    }, [])

    // Fetch tasks when project changes
    useEffect(() => {
        const fetchTasks = async () => {
            if (projectId && projectId !== "0") {
                const { data } = await supabase
                    .from("tareas")
                    .select("*")
                    .eq("proyecto_id", parseInt(projectId))
                    .order("titulo")
                if (data) setTasks(data)
            } else {
                setTasks([])
            }
        }
        fetchTasks()
    }, [projectId])

    useEffect(() => {
        if (isOpen) {
            if (nota) {
                setTitle(nota.titulo)
                setContent(nota.contenido || "")
                setDate(nota.fecha)
                setProjectId(nota.proyecto_id?.toString() || "0")
                setTaskId(nota.tarea_id?.toString() || "0")
                setImages(nota.url_imagenes || [])
            } else {
                // New Note
                setTitle("")
                setContent("")
                setDate(new Date().toISOString().split('T')[0])
                setProjectId("0")
                setTaskId("0")
                setImages([])
            }
        }
    }, [isOpen, nota])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setIsLoading(true)
        const file = e.target.files[0]
        const formData = new FormData()
        formData.append("file", file)

        try {
            // Upload to n8n webhook
            const response = await fetch("https://n8n.grupocilar.com/webhook/imagenes-notas", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Error al subir imagen")

            const data = await response.json()
            if (data.url_imagen) {
                setImages([...images, data.url_imagen])
                toast.success("Imagen subida correctamente")
            } else {
                throw new Error("No se recibió URL de la imagen")
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Error al subir la imagen")
        } finally {
            setIsLoading(false)
        }
    }

    const removeImage = (indexToRemove: number) => {
        setImages(images.filter((_, index) => index !== indexToRemove))
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("El título es obligatorio")
            return
        }

        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user?.id)
                .single()

            const userName = profile?.full_name || user?.email || "Usuario"

            const noteData = {
                titulo: title,
                contenido: content,
                fecha: date,
                proyecto_id: projectId === "0" ? null : parseInt(projectId),
                tarea_id: taskId === "0" ? null : parseInt(taskId),
                url_imagenes: images,
                autor_ultima_actualizacion: userName,
                ultima_actualizacion: new Date().toISOString(),
            }

            if (nota) {
                // Update
                const { error } = await supabase
                    .from("notas")
                    .update(noteData)
                    .eq("id", nota.id)

                if (error) throw error
                toast.success("Nota actualizada")
            } else {
                // Insert
                const { error } = await supabase
                    .from("notas")
                    .insert({
                        ...noteData,
                        autor: userName, // Set author only on creation
                    })

                if (error) throw error
                toast.success("Nota creada")
            }

            onSaved()
            onClose()
        } catch (error) {
            console.error("Save error:", error)
            toast.error("Error al guardar la nota")
        } finally {
            setIsLoading(false)
        }
    }

    // Read-only mode: when viewing detail (nota exists) and NOT explicit editing
    // Wait, requirement says "Editar, Ver detalle y Nueva Nota". 
    // Usually "Ver detalle" implies read-only. "Editar" implies edit mode.
    // The props logic: if nota && !isEditing -> View Mode. if nota && isEditing -> Edit Mode. if !nota -> Create Mode (editable).
    const isReadOnly = !!nota && !isEditing

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[50vw] sm:max-w-[800px] overflow-y-auto bg-white">
                <SheetHeader>
                    <SheetTitle className="text-2xl font-bold text-[#02457A]">
                        {nota ? (isEditing ? "Editar Nota" : "Detalle de Nota") : "Nueva Nota"}
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-900">Fecha</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                disabled={isReadOnly}
                                className="bg-[#E5E5E5] border-slate-200 text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-900">Proyecto</Label>
                            <Select
                                value={projectId}
                                onValueChange={(value) => {
                                    setProjectId(value)
                                    setTaskId("0") // Reset task when project changes
                                }}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger className="bg-[#E5E5E5] border-slate-200 text-slate-900">
                                    <SelectValue placeholder="Seleccionar proyecto" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">General (Sin proyecto)</SelectItem>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-900">Tarea (Opcional)</Label>
                        <Select
                            value={taskId}
                            onValueChange={setTaskId}
                            disabled={isReadOnly || projectId === "0"}
                        >
                            <SelectTrigger className="bg-[#E5E5E5] border-slate-200 text-slate-900">
                                <SelectValue placeholder="Seleccionar tarea" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Ninguna</SelectItem>
                                {tasks.map((t) => (
                                    <SelectItem key={t.id} value={t.id.toString()}>
                                        {t.titulo}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-900">Título</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Título de la nota"
                            className="bg-[#E5E5E5] border-slate-200 text-slate-900 font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-900">Contenido</Label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isReadOnly}
                            className="min-h-[150px] bg-[#E5E5E5] border-slate-200 text-slate-900"
                            placeholder="Escribe tu nota aquí..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-900">Imágenes (Máximo 10)</Label>
                        {!isReadOnly && (
                            <div className="flex items-center gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isLoading || images.length >= 10}
                                    className="bg-[#E5E5E5] border-slate-200 text-slate-700 hover:bg-slate-200"
                                    onClick={() => document.getElementById("image-upload")?.click()}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Subir Imagen
                                </Button>
                                <Input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={isLoading}
                                />
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                            </div>
                        )}

                        {/* Image Gallery */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                            {images.map((url, index) => (
                                <div key={index} className="relative group bg-slate-100 rounded-lg overflow-hidden border border-slate-200 aspect-square">
                                    <Image
                                        src={url}
                                        alt={`Imagen nota ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Metadata Read-only info */}
                    {nota && (
                        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-1">
                            <p>Creado por: {nota.autor} el {new Date(nota.fecha).toLocaleDateString()}</p>
                            <p>Última actualización: {nota.autor_ultima_actualizacion} ({new Date(nota.ultima_actualizacion).toLocaleString()})</p>
                        </div>
                    )}

                    {!isReadOnly && (
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button className="bg-[#02457A] hover:bg-[#02345e] text-white" onClick={handleSave} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
