"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { DollarSign } from "lucide-react"

interface ProjectBudgetData {
    id: number
    nombre: string
    presupuestoTotal: number
    gastosTotales: number
}

interface ProjectBudgetHealthChartProps {
    projects: ProjectBudgetData[]
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 p-2 rounded-md shadow-md text-xs">
                <p className="font-semibold mb-2 text-slate-800">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-500">{entry.name}:</span>
                        <span className="font-medium text-slate-900">
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function ProjectBudgetHealthChart({ projects }: ProjectBudgetHealthChartProps) {
    return (
        <Card className="col-span-1 shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Salud Presupuestal
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    {projects.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={projects}
                                margin={{ top: 80, right: 30, left: 20, bottom: 5 }}
                            >
                                <defs>
                                    <linearGradient id="blue-bar-gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    </linearGradient>
                                    <linearGradient id="orange-bar-gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="nombre"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Bar
                                    dataKey="presupuestoTotal"
                                    name="Presupuesto"
                                    fill="url(#blue-bar-gradient)"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="gastosTotales"
                                    name="Gastos"
                                    fill="url(#orange-bar-gradient)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                            <p>No hay información presupuestal disponible.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
