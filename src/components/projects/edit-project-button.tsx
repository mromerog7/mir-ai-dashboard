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
import { Pencil } from "lucide-react"
import { ProjectForm } from "@/components/projects/project-form"
import { useState } from "react"
import { Project } from "@/types"

export function EditProjectButton({ project }: { project: Project }) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-slate-400 hover:text-white">
                    <Pencil className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[50vw] pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-white">Editar Proyecto</SheetTitle>
                    <SheetDescription className="text-slate-400">
                        Modifica los detalles del proyecto. Haz clic en guardar cuando termines.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <ProjectForm
                        onSuccess={() => setOpen(false)}
                        initialData={project}
                        projectId={project.id}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
