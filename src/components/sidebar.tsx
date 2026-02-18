"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    LayoutDashboard,
    Briefcase,
    CheckSquare,
    Receipt,
    AlertTriangle,
    FileText,
    Users,
    Menu,
    Settings,
    LogOut,
    MapPin,
    FileBarChart,
    CloudSun,
    BookOpen
} from "lucide-react"
import { useState } from "react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [open, setOpen] = useState(false)

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
        },
        {
            label: "Proyectos",
            icon: Briefcase,
            href: "/projects",
        },
        {
            label: "Tareas",
            icon: CheckSquare,
            href: "/tasks",
        },
        {
            label: "Gastos",
            icon: Receipt,
            href: "/expenses",
        },
        {
            label: "Incidencias",
            icon: AlertTriangle,
            href: "/incidents",
        },
        {
            label: "Levantamientos",
            icon: MapPin,
            href: "/documents/surveys",
        },
        {
            label: "Cotizaciones",
            icon: FileBarChart,
            href: "/documents/quotes",
        },
        {
            label: "Reportes",
            icon: FileText,
            href: "/reports",
        },
        {
            label: "Minutas",
            icon: BookOpen,
            href: "/documents/minutes",
        },
        {
            label: "Reunión Clientes",
            icon: Users,
            href: "/documents/client-meetings",
        },
        {
            label: "Clima",
            icon: CloudSun,
            href: "/weather",
        },
        {
            label: "Usuarios",
            icon: Users,
            href: "/users",
        },
    ]

    return (
        <div className={cn("pb-12 h-full bg-slate-950", className)}>
            <div className="space-y-4 py-4 h-full flex flex-col">
                <div className="px-3 py-2 flex-1">
                    <div className="space-y-1">
                        {routes.map((route) => {
                            const isActive = pathname === route.href || pathname.startsWith(route.href + "/");
                            return (
                                <Link
                                    key={route.label}
                                    href={route.href}
                                    className={cn(
                                        "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition duration-200",
                                        isActive
                                            ? "text-blue-500 bg-blue-600/10 font-semibold"
                                            : "text-slate-400 hover:text-blue-400 hover:bg-slate-900"
                                    )}
                                >
                                    <div className="flex items-center flex-1">
                                        <route.icon className={cn("h-5 w-5 mr-3", isActive ? "text-blue-500" : "text-slate-500 group-hover:text-blue-400")} />
                                        {route.label}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <div
                        onClick={() => window.location.href = "/logout"}
                        className={cn(
                            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-red-400 hover:bg-red-500/10 rounded-xl transition duration-200 text-slate-400"
                        )}
                    >
                        <div className="flex items-center flex-1">
                            <LogOut className="h-5 w-5 mr-3 text-slate-500 group-hover:text-red-400" />
                            Cerrar Sesión
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function MobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-slate-800 border-slate-700">
                <Sidebar className="text-white" />
            </SheetContent>
        </Sheet>
    )
}
