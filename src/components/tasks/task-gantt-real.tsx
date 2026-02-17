"use client"

import { Task } from "@/types"
import { useMemo, useRef } from "react"

interface TaskGanttRealProps {
    tasks: Task[]
    onEditTask?: (task: Task) => void
}

const STATUS_DOT_COLORS: Record<string, string> = {
    "Pendiente": "bg-yellow-400",
    "En Proceso": "bg-blue-400",
    "Revisión": "bg-orange-400",
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

function parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split("T")[0].split("-")
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

export function TaskGanttReal({ tasks, onEditTask }: TaskGanttRealProps) {
    const today = useMemo(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    }, [])

    const scrollRef = useRef<HTMLDivElement>(null)
    const hasScrolledRef = useRef(false)

    // Compute dynamic range covering ALL tasks (both planned and real dates) + padding
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
            if (t.fecha_inicio_real) {
                const s = parseLocalDate(t.fecha_inicio_real)
                if (s < earliest) earliest = s
            }
            if (t.fecha_fin_real) {
                const e = parseLocalDate(t.fecha_fin_real)
                if (e > latest) latest = e
            }
        })

        const start = new Date(earliest)
        start.setDate(start.getDate() - 7)
        const end = new Date(latest)
        end.setDate(end.getDate() + 7)

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

    // Show tasks that have at least planned dates
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

    // Calculate bar position for any start/end pair
    const getBarStyleForDates = (startStr: string, endStr: string) => {
        const start = parseLocalDate(startStr)
        const end = parseLocalDate(endStr)

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

    const scrollToToday = () => {
        if (scrollRef.current && todayPositionPx !== null) {
            const containerWidth = scrollRef.current.clientWidth
            const targetScroll = todayPositionPx - containerWidth / 2
            scrollRef.current.scrollLeft = Math.max(0, targetScroll)
        }
    }

    useMemo(() => {
        if (!hasScrolledRef.current) {
            setTimeout(scrollToToday, 100)
            hasScrolledRef.current = true
        }
    }, [todayPositionPx])

    const scrollByWeeks = (weeks: number) => {
        if (scrollRef.current) {
            const px = weeks * 7 * DAY_WIDTH
            scrollRef.current.scrollBy({ left: px, behavior: "smooth" })
        }
    }

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
                <div className="flex items-center gap-4">
                    <span className="text-white font-semibold capitalize">{monthLabel}</span>
                    {/* Legend */}
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-2.5 rounded-sm bg-blue-500/80 border border-blue-400" />
                            <span className="text-slate-400">Programado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-2.5 rounded-sm bg-emerald-500/80 border border-emerald-400" />
                            <span className="text-slate-400">Real</span>
                        </div>
                    </div>
                </div>
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
                    {/* Month + Day headers */}
                    <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-20 border-b border-slate-800">
                        {/* Month row */}
                        <div className="flex">
                            <div className="min-w-[220px] w-[220px] flex-shrink-0 border-r border-slate-800 sticky left-0 bg-slate-900/95 backdrop-blur z-30" />
                            <div className="flex-1 relative">
                                <div className="flex">
                                    {(() => {
                                        const months: { label: string; span: number }[] = []
                                        let currentMonth = -1
                                        let currentYear = -1
                                        days.forEach((day) => {
                                            const m = day.getMonth()
                                            const y = day.getFullYear()
                                            if (m === currentMonth && y === currentYear) {
                                                months[months.length - 1].span++
                                            } else {
                                                currentMonth = m
                                                currentYear = y
                                                months.push({
                                                    label: day.toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
                                                    span: 1,
                                                })
                                            }
                                        })
                                        return months.map((m, i) => (
                                            <div
                                                key={i}
                                                className="text-xs font-semibold text-slate-300 capitalize border-r border-slate-700/50 flex items-center justify-center py-1"
                                                style={{ width: `${m.span * DAY_WIDTH}px`, minWidth: `${m.span * DAY_WIDTH}px` }}
                                            >
                                                {m.label}
                                            </div>
                                        ))
                                    })()}
                                </div>
                            </div>
                        </div>
                        {/* Day row */}
                        <div className="flex">
                            <div className="min-w-[220px] w-[220px] flex-shrink-0 border-r border-slate-800 px-3 py-2 text-xs text-slate-500 font-medium sticky left-0 bg-slate-900/95 backdrop-blur z-30">
                                Tarea
                            </div>
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
                    </div>

                    {/* Task rows - each row has TWO bars */}
                    <div className="relative">
                        {datedTasks.map((task) => {
                            const plannedBar = getBarStyleForDates(task.fecha_inicio!, task.fecha_fin!)
                            const hasReal = task.fecha_inicio_real && task.fecha_fin_real
                            const realBar = hasReal ? getBarStyleForDates(task.fecha_inicio_real!, task.fecha_fin_real!) : null
                            const statusDot = STATUS_DOT_COLORS[task.estatus || "Pendiente"] || "bg-slate-400"

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
                                    {/* Timeline area - taller to fit 2 bars */}
                                    <div className="flex-1 relative h-14">
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
                                        {/* Planned bar (top) - Blue */}
                                        {plannedBar && (
                                            <div
                                                className="absolute top-1 h-5 rounded-md bg-blue-500/70 border border-blue-400/60 flex items-center px-2 cursor-pointer shadow-sm hover:brightness-125 transition-all z-[6]"
                                                style={plannedBar}
                                                title={`PROG: ${task.fecha_inicio} → ${task.fecha_fin}`}
                                                onClick={() => onEditTask?.(task)}
                                            >
                                                <span className="text-[10px] font-medium text-white truncate drop-shadow-sm">
                                                    {task.titulo}
                                                </span>
                                            </div>
                                        )}
                                        {/* Real bar (bottom) - Green */}
                                        {realBar && (
                                            <div
                                                className="absolute top-7 h-5 rounded-md bg-emerald-500/70 border border-emerald-400/60 flex items-center px-2 cursor-pointer shadow-sm hover:brightness-125 transition-all z-[6]"
                                                style={realBar}
                                                title={`REAL: ${task.fecha_inicio_real} → ${task.fecha_fin_real}`}
                                                onClick={() => onEditTask?.(task)}
                                            >
                                                <span className="text-[10px] font-medium text-white truncate drop-shadow-sm">
                                                    {task.titulo}
                                                </span>
                                            </div>
                                        )}
                                        {/* No real dates indicator */}
                                        {!hasReal && plannedBar && (
                                            <div className="absolute top-8 left-0 px-2">
                                                <span className="text-[9px] text-slate-600 italic">sin fechas reales</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Undated tasks */}
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
                                            <div className="flex-1 relative h-14">
                                                <div className="absolute inset-0 flex">
                                                    {days.map((_, i) => (
                                                        <div key={i} className="border-r border-slate-800/20" style={{ width: `${DAY_WIDTH}px`, minWidth: `${DAY_WIDTH}px` }} />
                                                    ))}
                                                </div>
                                                <div className="absolute top-4 left-3 text-[10px] text-slate-600 italic">
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
