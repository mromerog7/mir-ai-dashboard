"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Task } from "@/types"
import { CheckCircle, Clock, AlertTriangle, TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { differenceInCalendarDays, parseISO, isAfter, startOfDay } from "date-fns"

interface TaskProgressSummaryProps {
    tasks: Task[]
}

export function TaskProgressSummary({ tasks }: TaskProgressSummaryProps) {
    if (!tasks || tasks.length === 0) return null

    // 1. Calculate Progress
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t =>
        t.estatus?.toLowerCase().includes("completada") ||
        t.estatus?.toLowerCase().includes("terminada")
    ).length

    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // 2. Calculate Time Deviation
    let totalDeviationDays = 0
    let delayedTasksCount = 0
    const today = startOfDay(new Date())

    tasks.forEach(task => {
        if (!task.fecha_fin) return

        const scheduledEnd = startOfDay(parseISO(task.fecha_fin as unknown as string)) // Handle ISO string format from DB

        let deviation = 0

        if (task.fecha_fin_real) {
            // Task is finished, compare Real vs Scheduled
            const realEnd = startOfDay(parseISO(task.fecha_fin_real as unknown as string))
            deviation = differenceInCalendarDays(realEnd, scheduledEnd)
        } else {
            // Task is NOT finished
            // If today is after scheduled end, it's delayed by (Today - Scheduled)
            // If today is before scheduled end, deviation is 0 (or we could project, but let's stick to current deviation)
            if (isAfter(today, scheduledEnd)) {
                deviation = differenceInCalendarDays(today, scheduledEnd)
                delayedTasksCount++
            }
        }

        totalDeviationDays += deviation
    })

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Project Progress */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Progreso General
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-slate-900">{progressPercentage.toFixed(0)}%</span>
                        <span className="text-xs text-slate-500">
                            ({completedTasks} de {totalTasks} tareas)
                        </span>
                    </div>
                    <Progress
                        value={progressPercentage}
                        className="h-2"
                        indicatorClassName={progressPercentage === 100 ? "bg-emerald-500" : "bg-blue-600"}
                    />
                </CardContent>
            </Card>

            {/* Time Deviation */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        Desviación de Tiempo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-2xl font-bold ${totalDeviationDays > 0 ? "text-red-600" : (totalDeviationDays < 0 ? "text-emerald-600" : "text-slate-700")}`}>
                            {totalDeviationDays > 0 ? `+${totalDeviationDays}` : totalDeviationDays} Días
                        </span>
                        {totalDeviationDays > 0 ? (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                        ) : totalDeviationDays < 0 ? (
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        ) : (
                            <CheckCircle className="h-5 w-5 text-slate-400" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500">
                        {totalDeviationDays > 0
                            ? "Días totales de retraso acumulado"
                            : (totalDeviationDays < 0 ? "Días de adelanto acumulado" : "Cronograma al día")
                        }
                    </p>
                </CardContent>
            </Card>

            {/* Status Breakdown / delayed */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Tareas Atrasadas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-2xl font-bold ${delayedTasksCount > 0 ? "text-red-600" : "text-slate-700"}`}>
                            {delayedTasksCount}
                        </span>
                        <span className="text-xs text-slate-500">tareas pendientes vencidas</span>
                    </div>
                    <p className="text-xs text-slate-500">
                        Requieren atención inmediata
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
