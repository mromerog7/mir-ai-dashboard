"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { inviteUser } from "@/app/actions/user-actions"

const formSchema = z.object({
    email: z.string().email({ message: "Correo inválido" }),
    fullName: z.string().min(2, { message: "El nombre es requerido" }),
    role: z.string().min(1, { message: "Selecciona un rol" }),
})

export function InviteUserSheet() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            fullName: "",
            role: "user",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const result = await inviteUser(values)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Invitación enviada correctamente")
                setOpen(false)
                form.reset()
                router.refresh()
            }
        } catch (error) {
            toast.error("Ocurrió un error al enviar la invitación")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-[#02457A] hover:bg-[#02335a] text-white">
                    <Mail className="mr-2 h-4 w-4" />
                    Invitar Usuario
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="text-[#02457A]">Invitar Usuario</SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Envía un correo de invitación para que el usuario configure su contraseña.
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-900">Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input placeholder="usuario@ejemplo.com" {...field} className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-900">Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Juan Pérez" {...field} className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-900">Rol</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                                                <SelectValue placeholder="Selecciona un rol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="engineer">Ingeniero</SelectItem>
                                            <SelectItem value="user">Usuario</SelectItem>
                                            <SelectItem value="viewer">Visualizador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <SheetFooter>
                            <Button type="submit" disabled={loading} className="w-full bg-[#02457A] hover:bg-[#02335a] text-white">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar Invitación
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
