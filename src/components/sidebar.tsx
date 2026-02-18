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
    BookOpen,
    DollarSign,
    Notebook
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
            href: "/tasks",
            color: "text-pink-700",
        },
        {
            label: "Gastos",
            icon: DollarSign,
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
            label: "Notas",
            icon: BookOpen,
            href: "/notes",
            color: "text-emerald-500",
        },
        {
            label: "Levantamientos",
            icon: FileText,
            href: "/documents/surveys",
            color: "text-emerald-500",
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
        <div className={cn("pb-12 h-full bg-[#65B017]", className)}>
            <div className="space-y-4 py-4 h-full flex flex-col">
                <div className="px-3 py-2 flex-1">
                    <div className="space-y-2">
                        {routes.map((route) => {
                            const isActive = pathname === route.href || pathname.startsWith(route.href + "/");
                            return (
                                <Link
                                    key={route.label}
                                    href={route.href}
                                    className={cn(
                                        "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200",
                                        isActive
                                            ? "text-white bg-slate-900 shadow-lg translate-x-2"
                                            : "text-white hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center flex-1">
                                        <route.icon className={cn("h-5 w-5 mr-3", isActive ? "text-white" : "text-white")} />
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
                            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-white/10 rounded-xl transition duration-200 text-white"
                        )}
                    >
                        <div className="flex items-center flex-1">
                            <LogOut className="h-5 w-5 mr-3 text-white" />
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
            <SheetContent side="left" className="p-0 bg-[#65B017] border-none">
                <Sidebar />
            </SheetContent>
        </Sheet>
    )
}
