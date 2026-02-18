"use client"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Plus } from "lucide-react"
import { ProjectForm } from "@/components/projects/project-form"
import { useState } from "react"

export function CreateProjectButton() {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Proyecto
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-white border-slate-200 text-slate-900 sm:max-w-[50vw] pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-[#02457A]">Crear Nuevo Proyecto</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Ingresa los detalles del nuevo proyecto. Haz clic en guardar cuando termines.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <ProjectForm onSuccess={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    )
}
