"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
    value: number
    label: string
    sublabel?: string
    size?: number
    strokeWidth?: number
    color?: string
    className?: string
    gradientId?: string
    tooltipContent?: React.ReactNode
    showTip?: boolean
}

export function CircularProgress({
    value,
    label,
    sublabel,
    size = 120,
    strokeWidth = 8,
    course = false, // unused but kept for compatibility if needed later
    color = "#3b82f6",
    className,
    gradientId = "blue-gradient",
    tooltipContent,
    showTip = true
}: CircularProgressProps & { course?: boolean }) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    // Calculate position for the glowing tip
    // -90 degrees is the start (top)
    const angle = (value / 100) * 360 - 90
    const angleRad = (angle * Math.PI) / 180

    // Center coordinates
    const cx = size / 2
    const cy = size / 2

    // Tip coordinates
    const tipX = cx + radius * Math.cos(angleRad)
    const tipY = cy + radius * Math.sin(angleRad)

    return (
        <div
            className={cn("group relative flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500", className)}
        // Removed title attribute to avoid double tooltips
        >
            {/* Custom Tooltip */}
            {tooltipContent && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 transition-all duration-200 ease-out">
                    <div className="bg-white border border-slate-200 p-2 rounded-md shadow-xl text-xs min-w-[180px]">
                        {tooltipContent}
                        {/* Little arrow pointing down */}
                        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-slate-200 rotate-45 transform"></div>
                    </div>
                </div>
            )}

            <div className="relative" style={{ width: size, height: size }}>
                {/* SVG Ring */}
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Definitions for Gradients */}
                    <defs>
                        <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0ea5e9" /> {/* Sky 500 */}
                            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue 500 */}
                        </linearGradient>
                        <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" /> {/* Violet 500 */}
                            <stop offset="100%" stopColor="#d946ef" /> {/* Fuchsia 500 */}
                        </linearGradient>
                        <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" /> {/* Amber 500 */}
                            <stop offset="100%" stopColor="#f97316" /> {/* Orange 500 */}
                        </linearGradient>
                        <linearGradient id="green-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22c55e" /> {/* Green 500 */}
                            <stop offset="100%" stopColor="#10b981" /> {/* Emerald 500 */}
                        </linearGradient>

                        {/* Glow Filter */}
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Track - Lighter for white background */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#e2e8f0" // Slate 200 - Light track for white bg
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeLinecap="round"
                    />

                    {/* Progress */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />

                    {/* Glowing Tip */}
                    {showTip && value > 0 && value < 100 && (
                        <circle
                            cx={tipX}
                            cy={tipY}
                            r={strokeWidth} // Slightly larger than stroke for the bulb effect
                            fill={`url(#${gradientId})`}
                            filter="url(#glow)"
                            className="transition-all duration-1000 ease-out"
                        />
                    )}
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-2xl font-bold text-slate-900"
                    >
                        {value}%
                    </span>
                    {/* <span className="text-sm" style={{ color: color }}>%</span> */}
                </div>
            </div>

            {/* Labels */}
            <div className="text-center mt-4 cursor-default">
                <h3 className="font-semibold text-slate-900 tracking-wider text-sm uppercase mb-1 truncate max-w-[120px]">
                    {label}
                </h3>
                {sublabel && (
                    <p className="text-xs text-slate-500 max-w-[150px] mx-auto leading-relaxed">
                        {sublabel}
                    </p>
                )}
            </div>
        </div>
    )
}
