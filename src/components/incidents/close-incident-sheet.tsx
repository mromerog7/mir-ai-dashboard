"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, CalendarIcon, CheckCircle } from "lucide-react"
import { Incident } from "@/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

const formSchema = z.object({
    solucion_final: z.string().min(5, {
        message: "La solución final debe tener al menos 5 caracteres.",
    }),
    fecha_cierre: z.date(),
})

type FormValues = z.infer<typeof formSchema>

interface CloseIncidentSheetProps {
    incident: Incident
    trigger?: React.ReactNode
}

export function CloseIncidentSheet({ incident, trigger }: CloseIncidentSheetProps) {
    const [open, setOpen] = useState(false)
    const [isSaving, setSaving] = useState(false)
    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            solucion_final: incident.solucion_final || "",
            fecha_cierre: incident.fecha_cierre ? new Date(incident.fecha_cierre) : new Date(),
        },
    })

    async function onSubmit(data: FormValues) {
        setSaving(true)
        const supabase = createClient()

        try {
            const { error } = await supabase
                .from("incidencias")
                .update({
                    solucion_final: data.solucion_final,
                    fecha_cierre: format(data.fecha_cierre, "yyyy-MM-dd"),
                    estatus: "Resuelta", // Cambia el estatus a Resuelta
                })
                .eq("id", incident.id)

            if (error) throw error

            setOpen(false)
            router.refresh()
            alert("Incidencia cerrada correctamente")

        } catch (error: any) {
            console.error("Error closing incident:", error)
            alert(`Error al cerrar incidencia: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="w-full mt-2 border-blue-500/50 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Cerrar Incidencia
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-[500px] w-full bg-slate-900 border-l-slate-800 text-white">
                <SheetHeader>
                    <SheetTitle className="text-white">Cerrar Incidencia</SheetTitle>
                    <SheetDescription className="text-slate-400">
                        Completa la información para marcar esta incidencia como resuelta.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

                        <FormField
                            control={form.control}
                            name="fecha_cierre"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha de Cierre</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP", { locale: es })
                                                    ) : (
                                                        <span>Seleccionar fecha</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700 text-white" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="solucion_final"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Solución Final</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe la solución implementada..."
                                            className="bg-slate-800 border-slate-700 min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <SheetFooter>
                            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar Cierre
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
