"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ExpenseDetailSheet } from "@/components/expenses/expense-detail-sheet"
import { DataTable } from "@/app/(dashboard)/projects/data-table"
import { columns } from "./columns" // We assume this exists based on previous file content
import Image from "next/image"
import { useEffect, useState, useMemo } from "react"
import { Expense } from "@/types"
import { FolderOpen } from "lucide-react"

interface Project {
    id: number;
    nombre: string;
}

interface ExpensesViewProps {
    initialExpenses: Expense[]
}

export function ExpensesView({ initialExpenses }: ExpensesViewProps) {
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all")

    useEffect(() => {
        setExpenses(initialExpenses)
    }, [initialExpenses])

    useEffect(() => {
        const fetchProjects = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("proyectos")
                .select("id, nombre")
                .order("nombre", { ascending: true });
            if (data) setProjects(data);
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('realtime-expenses')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'gastos' },
                async (payload) => {
                    console.log("Realtime event received:", payload);
                    if (payload.eventType === 'INSERT') {
                        const { data } = await supabase
                            .from('gastos')
                            .select('*, proyectos(nombre, cliente, ubicacion)')
                            .eq('id', payload.new.id)
                            .single()
                        if (data) setExpenses((prev) => [data as unknown as Expense, ...prev].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()))
                    } else if (payload.eventType === 'UPDATE') {
                        const { data } = await supabase
                            .from('gastos')
                            .select('*, proyectos(nombre, cliente, ubicacion)')
                            .eq('id', payload.new.id)
                            .single()
                        if (data) setExpenses((prev) => prev.map((e) => e.id === payload.new.id ? (data as unknown as Expense) : e))
                    } else if (payload.eventType === 'DELETE') {
                        setExpenses((prev) => prev.filter((e) => e.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Filter expenses by selected project
    const filteredExpenses = useMemo(() => {
        if (selectedProjectId === "all") return expenses;
        return expenses.filter(e => e.proyecto_id?.toString() === selectedProjectId);
    }, [expenses, selectedProjectId]);

    // Calculate total amount based on filtered list
    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, expense) => sum + (expense.monto || 0), 0);
    }, [filteredExpenses]);

    // Top 3 recent expenses for cards
    const recentExpenses = filteredExpenses.slice(0, 3)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Control de Gastos</h1>
                <div className="flex items-center space-x-4">
                    {/* Total Amount Display */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total</span>
                        <span className="text-lg font-bold text-blue-400 leading-none">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAmount)}
                        </span>
                    </div>

                    {/* Project Filter */}
                    <div className="relative flex items-center">
                        <FolderOpen className="absolute left-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-md pl-8 pr-8 py-1.5 appearance-none cursor-pointer hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Todos los proyectos</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id.toString()}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                        <svg className="absolute right-2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Top 3 Recent Expenses Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentExpenses.map((expense) => (
                    <Card key={expense.id} className="bg-slate-800 border-slate-700 text-white overflow-hidden hover:border-slate-600 transition-colors flex flex-col sm:flex-row h-full">
                        {typeof expense.ticket_url === 'string' && expense.ticket_url.trim() !== "" && (
                            <div className="w-full sm:w-24 h-48 sm:h-auto relative shrink-0 bg-slate-900 flex items-center justify-center">
                                <div className="w-full h-full relative group">
                                    <Image
                                        src={expense.ticket_url}
                                        alt="Ticket"
                                        fill
                                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            </div>
                        )}
                        <CardContent className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="text-slate-300 border-slate-600">{expense.categoria || "Gasto"}</Badge>
                                    <span className="font-bold text-blue-400">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(expense.monto)}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-sm line-clamp-2 mb-1" title={expense.concepto}>{expense.concepto}</h3>
                                <p className="text-xs text-slate-400 line-clamp-1">
                                    {expense.proyectos?.nombre || "Sin proyecto"}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    {(() => {
                                        if (!expense.fecha) return "Fecha desconocida";
                                        const dateStr = expense.fecha.includes('T') ? expense.fecha : `${expense.fecha}T00:00:00`;
                                        const date = new Date(dateStr);
                                        return !isNaN(date.getTime()) ? format(date, "PPP", { locale: es }) : "Fecha inválida";
                                    })()}
                                </p>
                            </div>

                            <ExpenseDetailSheet expense={expense} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* All Expenses Table */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-4">Historial de Gastos</h2>
                <DataTable columns={columns} data={filteredExpenses} />
            </div>
        </div>
    )
}
