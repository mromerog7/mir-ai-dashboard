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
import { TaskForm } from "@/components/tasks/task-form"
import { useState } from "react"
import { Task } from "@/types"

export function EditTaskButton({ task }: { task: Task }) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-500 hover:text-blue-600">
                    <Pencil className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[50vw] bg-white border-slate-200 text-slate-900 overflow-y-auto pl-8 pr-8">
                <SheetHeader>
                    <SheetTitle className="text-[#02457A]">Editar Tarea</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Modifica los detalles de la tarea.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <TaskForm
                        onSuccess={() => setOpen(false)}
                        initialData={task}
                        taskId={task.id}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
