"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts"
import { Info } from "lucide-react"

interface ProjectData {
    id: number
    nombre: string
    completionRate: number
    totalTasks: number
    completedTasks: number
}

interface ProjectProgressChartProps {
    projects: ProjectData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white border border-slate-200 p-2 rounded-md shadow-md text-xs">
                <p className="font-semibold mb-1 text-slate-800">{data.nombre}</p>
                <div className="space-y-1">
                    <p className="text-blue-600">
                        Avance: <span className="font-bold">{data.completionRate}%</span>
                    </p>
                    <p className="text-slate-500">
                        Tareas: {data.completedTasks} / {data.totalTasks}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export function ProjectProgressChart({ projects }: ProjectProgressChartProps) {
    const data = projects.map(p => ({
        ...p,
        // Ensure we always have a value for the bar
        value: p.completionRate
    }));

    return (
        <Card className="col-span-1 shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Avance de Proyectos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                            >
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis
                                    type="category"
                                    dataKey="nombre"
                                    width={100}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.value === 100 ? '#10b981' : '#3b82f6'}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey="completionRate"
                                        position="right"
                                        formatter={(val: number) => `${val}%`}
                                        style={{ fontSize: '11px', fill: '#64748b', fontWeight: 500 }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                            <p>No hay proyectos activos con tareas.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
