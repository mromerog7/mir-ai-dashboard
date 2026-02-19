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
import { TaskForm } from "@/components/tasks/task-form"
import { useState } from "react"

export function CreateTaskButton({ defaultProjectId }: { defaultProjectId?: string | number }) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Tarea
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-[#02457A]">Crear Nueva Tarea</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Ingresa los detalles de la nueva tarea.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <TaskForm
                        onSuccess={() => setOpen(false)}
                        defaultProjectId={defaultProjectId?.toString()}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
