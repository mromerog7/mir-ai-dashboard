"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLatestActivities } from "@/app/(dashboard)/dashboard/actions";

interface Activity {
    type: string;
    date: string;
    description: string;
}

interface ActivityFeedWidgetProps {
    initialActivities: Activity[];
}

export function ActivityFeedWidget({ initialActivities }: ActivityFeedWidgetProps) {
    const [activities, setActivities] = useState<Activity[]>(initialActivities);

    useEffect(() => {
        // Poll for new activities every 60 seconds
        const interval = setInterval(async () => {
            try {
                const latest = await fetchLatestActivities();
                setActivities(latest);
            } catch (error) {
                console.error("Failed to refresh activities:", error);
            }
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
            <CardHeader>
                <CardTitle>Resumen de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.length > 0 ? activities.map((activity, i) => (
                        <div key={i} className="flex items-center">
                            <span className="relative flex h-2 w-2 mr-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                            </span>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none text-slate-900">{activity.description}</p>
                                <p className="text-sm text-slate-500">{new Date(activity.date).toLocaleDateString("es-MX", { day: 'numeric', month: 'long' })}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-slate-500">No hay actividad reciente.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
