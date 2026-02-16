"use client"

import { Task } from "@/types"
import { useMemo, useRef } from "react"

interface TaskGanttProps {
    tasks: Task[]
    onEditTask?: (task: Task) => void
}

const STATUS_BAR_COLORS: Record<string, string> = {
    "Pendiente": "bg-yellow-500/80",
    "En Proceso": "bg-blue-500/80",
    "Revisión": "bg-purple-500/80",
    "Completada": "bg-green-500/80",
    "Cancelada": "bg-slate-500/80",
}

const STATUS_BAR_BORDERS: Record<string, string> = {
    "Pendiente": "border-yellow-400",
    "En Proceso": "border-blue-400",
    "Revisión": "border-purple-400",
    "Completada": "border-green-400",
    "Cancelada": "border-slate-400",
}

const STATUS_DOT_COLORS: Record<string, string> = {
    "Pendiente": "bg-yellow-400",
    "En Proceso": "bg-blue-400",
    "Revisión": "bg-purple-400",
    "Completada": "bg-green-400",
    "Cancelada": "bg-slate-400",
}

const DAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"]
const DAY_WIDTH = 44

function getDaysInRange(start: Date, end: Date): Date[] {
    const days: Date[] = []
    const current = new Date(start)
    while (current <= end) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }
    return days
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
}

function getMonthName(date: Date): string {
    return date.toLocaleDateString("es-MX", { month: "long", year: "numeric" })
}

// Parse a date string as local date to avoid timezone shift
// "2026-02-16" → Feb 16 00:00 local (not UTC)
function parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split("T")[0].split("-")
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

export function TaskGantt({ tasks, onEditTask }: TaskGanttProps) {
    const today = useMemo(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    }, [])

    const scrollRef = useRef<HTMLDivElement>(null)
    const hasScrolledRef = useRef(false)

    // Compute dynamic range that covers ALL tasks + padding
    const { rangeStart, rangeEnd } = useMemo(() => {
        let earliest = new Date(today)
        let latest = new Date(today)

        tasks.forEach(t => {
            if (t.fecha_inicio) {
                const s = parseLocalDate(t.fecha_inicio)
                if (s < earliest) earliest = s
            }
            if (t.fecha_fin) {
                const e = parseLocalDate(t.fecha_fin)
                if (e > latest) latest = e
            }
        })

        // Add 7-day padding on each side
        const start = new Date(earliest)
        start.setDate(start.getDate() - 7)
        const end = new Date(latest)
        end.setDate(end.getDate() + 7)

        // Ensure minimum 60-day range
        const msPerDay = 86400000
        const rangeDays = Math.round((end.getTime() - start.getTime()) / msPerDay)
        if (rangeDays < 60) {
            const extraDays = Math.ceil((60 - rangeDays) / 2)
            start.setDate(start.getDate() - extraDays)
            end.setDate(end.getDate() + extraDays)
        }

        return { rangeStart: start, rangeEnd: end }
    }, [tasks, today])

    const days = useMemo(() => getDaysInRange(rangeStart, rangeEnd), [rangeStart, rangeEnd])
    const totalDays = days.length

    // Split tasks: with dates vs without dates
    const { datedTasks, undatedTasks } = useMemo(() => {
        const dated: Task[] = []
        const undated: Task[] = []
        tasks.forEach(t => {
            if (t.fecha_inicio && t.fecha_fin) {
                dated.push(t)
            } else {
                undated.push(t)
            }
        })
        dated.sort((a, b) => parseLocalDate(a.fecha_inicio!).getTime() - parseLocalDate(b.fecha_inicio!).getTime())
        return { datedTasks: dated, undatedTasks: undated }
    }, [tasks])

    // Calculate bar position using pixel-based grid alignment
    const getBarStyle = (task: Task) => {
        const start = parseLocalDate(task.fecha_inicio!)
        const end = parseLocalDate(task.fecha_fin!)

        const rangeStartTime = rangeStart.getTime()
        const msPerDay = 86400000

        const startDayIndex = Math.round((start.getTime() - rangeStartTime) / msPerDay)
        const endDayIndex = Math.round((end.getTime() - rangeStartTime) / msPerDay)

        const clampedStart = Math.max(0, startDayIndex)
        const clampedEnd = Math.min(totalDays - 1, endDayIndex)

        if (clampedEnd < 0 || clampedStart >= totalDays) return null

        const leftPx = clampedStart * DAY_WIDTH
        const widthPx = (clampedEnd - clampedStart + 1) * DAY_WIDTH

        return {
            left: `${leftPx}px`,
            width: `${widthPx}px`,
        }
    }

    // Today marker position
    const todayPositionPx = useMemo(() => {
        const msPerDay = 86400000
        const dayOffset = Math.round((today.getTime() - rangeStart.getTime()) / msPerDay)
        if (dayOffset < 0 || dayOffset >= totalDays) return null
        return dayOffset * DAY_WIDTH + DAY_WIDTH / 2
    }, [today, rangeStart, totalDays])

    // Auto-scroll to today on mount
    const scrollToToday = () => {
        if (scrollRef.current && todayPositionPx !== null) {
            const containerWidth = scrollRef.current.clientWidth
            const targetScroll = todayPositionPx - containerWidth / 2
            scrollRef.current.scrollLeft = Math.max(0, targetScroll)
        }
    }

    // Auto-scroll once on mount
    useMemo(() => {
        if (!hasScrolledRef.current) {
            // Use setTimeout to ensure DOM is rendered
            setTimeout(scrollToToday, 100)
            hasScrolledRef.current = true
        }
    }, [todayPositionPx])

    // Scroll left/right by 2 weeks
    const scrollByWeeks = (weeks: number) => {
        if (scrollRef.current) {
            const px = weeks * 7 * DAY_WIDTH
            scrollRef.current.scrollBy({ left: px, behavior: "smooth" })
        }
    }

    // Month label for header
    const monthLabel = useMemo(() => {
        const startMonth = getMonthName(rangeStart)
        const endMonth = getMonthName(rangeEnd)
        if (startMonth === endMonth) return startMonth
        return `${rangeStart.toLocaleDateString("es-MX", { month: "short" })} – ${rangeEnd.toLocaleDateString("es-MX", { month: "short", year: "numeric" })}`
    }, [rangeStart, rangeEnd])

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
                <span className="text-white font-semibold capitalize">{monthLabel}</span>
                <div className="flex items-center gap-2">
                    <button
                        className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        onClick={() => scrollByWeeks(-2)}
                    >
                        ‹
                    </button>
                    <button
                        className="bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 text-xs px-3 py-1.5 rounded-md transition-colors"
                        onClick={scrollToToday}
                    >
                        Hoy
                    </button>
                    <button
                        className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        onClick={() => scrollByWeeks(2)}
                    >
                        ›
                    </button>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto" ref={scrollRef}>
                <div style={{ minWidth: `${totalDays * DAY_WIDTH}px` }}>
                    {/* Day headers */}
                    <div className="flex border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-20">
                        {/* Task name column */}
                        <div className="min-w-[220px] w-[220px] flex-shrink-0 border-r border-slate-800 px-3 py-2 text-xs text-slate-500 font-medium sticky left-0 bg-slate-900/95 backdrop-blur z-30">
                            Tarea
                        </div>
                        {/* Day columns */}
                        <div className="flex-1 relative">
                            <div className="flex">
                                {days.map((day, i) => {
                                    const isToday = isSameDay(day, today)
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6
                                    return (
                                        <div
                                            key={i}
                                            className={`flex flex-col items-center justify-center py-1.5 border-r border-slate-800/50 ${isToday ? "bg-orange-500/10" : isWeekend ? "bg-slate-800/30" : ""
                                                }`}
                                            style={{ width: `${DAY_WIDTH}px`, minWidth: `${DAY_WIDTH}px` }}
                                        >
                                            <span className={`text-[10px] font-medium ${isToday ? "text-orange-400" : "text-slate-500"}`}>
                                                {DAY_LETTERS[day.getDay()]}
                                            </span>
                                            <span className={`text-xs font-semibold ${isToday
                                                ? "bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                                                : "text-slate-400"
                                                }`}>
                                                {day.getDate()}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Task rows */}
                    <div className="relative">
                        {datedTasks.map((task) => {
                            const barStyle = getBarStyle(task)
                            const status = task.estatus || "Pendiente"
                            const barColor = STATUS_BAR_COLORS[status] || STATUS_BAR_COLORS["Pendiente"]
                            const barBorder = STATUS_BAR_BORDERS[status] || STATUS_BAR_BORDERS["Pendiente"]
                            const statusDot = STATUS_DOT_COLORS[status] || "bg-slate-400"

                            return (
                                <div key={task.id} className="flex border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                                    {/* Task name - fixed left */}
                                    <div className="min-w-[220px] w-[220px] flex-shrink-0 border-r border-slate-800 px-3 py-2 flex items-center gap-2 sticky left-0 bg-slate-900 group-hover:bg-slate-800/40 z-10">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
                                        <span
                                            className="text-sm text-white truncate flex-1 cursor-pointer hover:text-blue-300 transition-colors"
                                            title={task.titulo}
                                            onClick={() => onEditTask?.(task)}
                                        >
                                            {task.titulo}
                                        </span>
                                    </div>
                                    {/* Timeline area */}
                                    <div className="flex-1 relative h-10">
                                        {/* Grid lines */}
                                        <div className="absolute inset-0 flex">
                                            {days.map((day, i) => {
                                                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`border-r border-slate-800/30 ${isWeekend ? "bg-slate-800/15" : ""}`}
                                                        style={{ width: `${DAY_WIDTH}px`, minWidth: `${DAY_WIDTH}px` }}
                                                    />
                                                )
                                            })}
                                        </div>
                                        {/* Today marker */}
                                        {todayPositionPx !== null && (
                                            <div
                                                className="absolute top-0 bottom-0 w-0.5 bg-orange-500/50 z-[5]"
                                                style={{ left: `${todayPositionPx}px` }}
                                            />
                                        )}
                                        {/* Bar */}
                                        {barStyle && (
                                            <div
                                                className={`absolute top-1.5 h-7 rounded-md ${barColor} border ${barBorder} flex items-center px-2 cursor-pointer shadow-sm hover:brightness-125 hover:scale-[1.02] transition-all z-[6]`}
                                                style={barStyle}
                                                title={`${task.titulo}\n${task.proyectos?.nombre || "General"}\n${task.fecha_inicio} → ${task.fecha_fin}\n${task.estatus || "Pendiente"}`}
                                                onClick={() => onEditTask?.(task)}
                                            >
                                                <span className="text-[11px] font-medium text-white truncate drop-shadow-sm">
                                                    {task.titulo}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Undated tasks section */}
                        {undatedTasks.length > 0 && (
                            <>
                                <div className="flex border-b border-slate-800/50 bg-slate-800/20">
                                    <div className="min-w-[220px] w-[220px] flex-shrink-0 border-r border-slate-800 px-3 py-1.5 sticky left-0 bg-slate-800/20 z-10">
                                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sin fechas asignadas</span>
                                    </div>
                                    <div className="flex-1" />
                                </div>
                                {undatedTasks.map((task) => {
                                    const statusDot = STATUS_DOT_COLORS[task.estatus || "Pendiente"] || "bg-slate-400"
                                    return (
                                        <div key={task.id} className="flex border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group opacity-60">
                                            <div className="min-w-[220px] w-[220px] flex-shrink-0 border-r border-slate-800 px-3 py-2 flex items-center gap-2 sticky left-0 bg-slate-900 group-hover:bg-slate-800/40 z-10">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
                                                <span className="text-sm text-slate-400 truncate flex-1" title={task.titulo}>
                                                    {task.titulo}
                                                </span>
                                            </div>
                                            <div className="flex-1 relative h-10">
                                                <div className="absolute inset-0 flex">
                                                    {days.map((_, i) => (
                                                        <div key={i} className="border-r border-slate-800/20" style={{ width: `${DAY_WIDTH}px`, minWidth: `${DAY_WIDTH}px` }} />
                                                    ))}
                                                </div>
                                                <div className="absolute top-3 left-3 text-[10px] text-slate-600 italic">
                                                    — sin fecha inicio/fin —
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}

                        {/* Empty state */}
                        {tasks.length === 0 && (
                            <div className="py-16 text-center text-slate-500">
                                No hay tareas para mostrar.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
