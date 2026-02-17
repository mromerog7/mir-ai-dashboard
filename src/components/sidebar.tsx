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
            color: "text-sky-500",
        },
        {
            label: "Proyectos",
            icon: Briefcase,
            href: "/projects",
            color: "text-violet-500",
        },
        {
            label: "Tareas",
            icon: CheckSquare,
            href: "/tasks", // Changed from /projects to distinct route
            color: "text-pink-700",
        },
        {
            label: "Gastos",
            icon: Receipt,
            href: "/expenses",
            color: "text-orange-700",
        },
        {
            label: "Incidencias",
            icon: AlertTriangle,
            href: "/incidents",
            color: "text-red-700",
        },
        {
            label: "Levantamientos",
            icon: MapPin,
            href: "/documents/surveys",
            color: "text-emerald-500",
        },
        {
            label: "Cotizaciones",
            icon: FileBarChart,
            href: "/documents/quotes",
            color: "text-green-700",
        },
        {
            label: "Reportes",
            icon: FileText,
            href: "/reports",
            color: "text-blue-500",
        },
        {
            label: "Minutas",
            icon: BookOpen,
            href: "/documents/minutes",
            color: "text-indigo-500",
        },
        {
            label: "Clima",
            icon: CloudSun,
            href: "/weather",
            color: "text-yellow-500",
        },
        {
            label: "Usuarios",
            icon: Users,
            href: "/users",
            color: "text-blue-700",
        },
    ]

    return (
        <div className={cn("pb-12 h-full", className)}>
            <div className="space-y-4 py-4 h-full flex flex-col">
                <div className="px-3 py-2 flex-1">
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Link
                                key={route.label}
                                href={route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-slate-700 rounded-lg transition",
                                    pathname === route.href || pathname.startsWith(route.href + "/") ? "text-white bg-slate-700 font-bold" : "text-slate-400"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                    {route.label}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <div
                        onClick={() => window.location.href = "/logout"}
                        className={cn(
                            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-slate-700 rounded-lg transition text-slate-400"
                        )}
                    >
                        <div className="flex items-center flex-1">
                            <LogOut className="h-5 w-5 mr-3 text-red-500" />
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
