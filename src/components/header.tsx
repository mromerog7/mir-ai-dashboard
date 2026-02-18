"use client"



import { MobileSidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"

export function Header() {
    return (
        <div className="flex items-center px-6 h-[73px] border-b border-slate-200 bg-white text-[#02457A]">
            <MobileSidebar />
            <h2 className="ml-4 font-bold text-3xl tracking-tight text-[#02457A]">
                Seguimiento de Proyectos
            </h2>
            <div className="ml-auto flex items-center space-x-4">
                {/* User Profile or Notifications could go here */}
            </div>
        </div>
    )
}
