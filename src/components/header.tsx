"use client"



import { MobileSidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"

export function Header() {
    return (
        <div className="flex items-center px-6 h-[73px] border-b border-[#1f2937] bg-[#111827] text-white">
            <MobileSidebar />
            <h2 className="ml-4 font-bold text-3xl text-white tracking-tight">
                Seguimiento de Proyectos
            </h2>
            <div className="ml-auto flex items-center space-x-4">
                {/* User Profile or Notifications could go here */}
            </div>
        </div>
    )
}
