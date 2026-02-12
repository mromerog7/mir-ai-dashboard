"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const ProjectSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    cliente: z.string().min(1, "El cliente es requerido"),
    solicitante: z.string().optional(),
    ubicacion: z.string().optional(),
    fecha_inicio: z.string(), // ISO string from date picker
    status: z.string().default("Activo"),
})

export async function createProject(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // Validate fields using Zod
    const validatedFields = ProjectSchema.safeParse({
        nombre: formData.get("nombre"),
        cliente: formData.get("cliente"),
        solicitante: formData.get("solicitante"),
        ubicacion: formData.get("ubicacion"),
        fecha_inicio: formData.get("fecha_inicio"),
        status: "Activo", // Default for new projects
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Faltan campos requeridos. Error al crear proyecto.",
        }
    }

    const { error } = await supabase.from("proyectos").insert({
        ...validatedFields.data,
        // consecutivo_folio is auto-generated in DB sequence usually, or we handle it here if requested.
        // Assuming DB handle it or it's nullable for now.
    })

    if (error) {
        console.error(error)
        return { message: "Error de base de datos: error al crear proyecto." }
    }

    revalidatePath("/projects")
    redirect("/projects")
}
