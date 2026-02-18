"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MonthExpensesWidgetProps {
    initialTotal: number;
}

export function MonthExpensesWidget({ initialTotal }: MonthExpensesWidgetProps) {
    const [total, setTotal] = useState(initialTotal);
    const supabase = createClient();

    const fetchTotal = async () => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data } = await supabase
            .from("gastos")
            .select("monto")
            .gte("fecha", startOfMonth.toISOString());

        const newTotal = data?.reduce((sum, expense) => sum + (Number(expense.monto) || 0), 0) || 0;
        setTotal(newTotal);
    };

    useEffect(() => {
        // Initial client-side fetch to ensure timezone consistency if needed, 
        // though initialTotal passed from server is usually fine. 
        // We mainly need this for realtime updates.

        const channel = supabase
            .channel("realtime-expenses-total")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "gastos",
                },
                () => {
                    fetchTotal();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Gastos del Mes</CardTitle>
                <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}
                </div>
                <p className="text-xs text-slate-500">Gastos registrados</p>
            </CardContent>
        </Card>
    );
}
