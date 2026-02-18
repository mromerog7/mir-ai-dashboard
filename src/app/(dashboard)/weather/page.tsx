import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudRain, CloudSun, Sun, Wind, Droplets, ThermometerSun, CalendarDays, Cloud, Snowflake, CloudLightning } from "lucide-react";

// Helper to map WMO weather codes
function getWeatherIcon(code: number) {
    if (code === 0) return { icon: Sun, label: "Despejado", color: "text-yellow-500" };
    if (code >= 1 && code <= 3) return { icon: CloudSun, label: "Parcialmente nublado", color: "text-yellow-400" };
    if (code >= 45 && code <= 48) return { icon: Cloud, label: "Niebla", color: "text-slate-400" };
    if (code >= 51 && code <= 67) return { icon: CloudRain, label: "Lluvia ligera", color: "text-blue-400" };
    if (code >= 71 && code <= 77) return { icon: Snowflake, label: "Nieve", color: "text-white" };
    if (code >= 80 && code <= 82) return { icon: CloudRain, label: "Lluvia", color: "text-blue-500" };
    if (code >= 95 && code <= 99) return { icon: CloudLightning, label: "Tormenta", color: "text-purple-500" };
    return { icon: CloudSun, label: "Variable", color: "text-slate-400" };
}

export default async function WeatherPage() {
    // Fetch Weather Data (Open-Meteo) for Comalcalco
    let current = { temp: 0, code: 0, wind: 0, humidity: 0 };
    let daily: any[] = [];

    try {
        const res = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=18.2619&longitude=-93.2250&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FMexico_City",
            { next: { revalidate: 3600 } }
        );
        const data = await res.json();

        if (data.current) {
            current = {
                temp: Math.round(data.current.temperature_2m),
                code: data.current.weather_code,
                wind: data.current.wind_speed_10m,
                humidity: data.current.relative_humidity_2m
            };
        }

        if (data.daily) {
            daily = data.daily.time.map((time: string, index: number) => ({
                date: time,
                code: data.daily.weather_code[index],
                max: Math.round(data.daily.temperature_2m_max[index]),
                min: Math.round(data.daily.temperature_2m_min[index]),
                precip: data.daily.precipitation_probability_max[index]
            })).slice(0, 5); // Take 5 days
        }
    } catch (e) {
        console.log("Weather page fetch error", e);
    }

    const currentInfo = getWeatherIcon(current.code);
    const CurrentIcon = currentInfo.icon;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-[#02457A]">Seguridad Ambiental (Clima)</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Current Weather Card */}
                <Card className="bg-white border-slate-200 text-slate-900 col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <CurrentIcon className={`mr-2 h-6 w-6 ${currentInfo.color}`} />
                            Pronóstico en Obra: Comalcalco
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center justify-between">
                            <div className="mb-4 md:mb-0">
                                <div className="text-5xl font-bold">{current.temp}°C</div>
                                <p className="text-slate-500 mt-2">{currentInfo.label}</p>
                                <div className="flex items-center mt-4 space-x-6 text-sm text-slate-300">
                                    <span className="flex items-center" title="Viento"><Wind className="mr-2 h-4 w-4 text-slate-500" /> {current.wind} km/h</span>
                                    <span className="flex items-center" title="Humedad"><Droplets className="mr-2 h-4 w-4 text-blue-400" /> {current.humidity}%</span>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <div className={`badge px-3 py-1 rounded-full text-sm font-medium ${current.wind > 20 || current.code >= 95 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                                    }`}>
                                    {current.wind > 20 || current.code >= 95 ? 'Precaución: Viento/Tormenta' : 'Condiciones Seguras para Alturas'}
                                </div>
                                <div className={`badge px-3 py-1 rounded-full text-sm font-medium ${current.temp > 30 ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                                    }`}>
                                    {current.temp > 30 ? 'Precaución: Calor Extremo' : 'Condiciones Seguras para Soldar'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recommendations Card */}
                <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
                    <CardHeader>
                        <CardTitle>Recomendaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
                            <li>Hidratación constante para el personal.</li>
                            <li>Uso obligatorio de bloqueador solar.</li>
                            <li>Monitorear ráfagas de viento después de las 16:00.</li>
                            {current.code >= 51 && <li className="text-yellow-600 font-medium">Protección contra lluvia requerida.</li>}
                        </ul>
                    </CardContent>
                </Card>

                {/* 5-Day Forecast Card */}
                <Card className="col-span-3 bg-white border-slate-200 text-slate-900 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <CalendarDays className="mr-2 h-5 w-5 text-blue-400" />
                            Pronóstico a 5 Días
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {daily.map((day, i) => {
                                const info = getWeatherIcon(day.code);
                                const Icon = info.icon;
                                const date = new Date(day.date + 'T00:00:00'); // Ensure local date
                                let dayName = date.toLocaleDateString('es-MX', { weekday: 'long' });
                                if (i === 0) dayName = "Hoy";
                                const formattedDate = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

                                return (
                                    <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <span className="capitalize text-sm font-medium text-slate-700 mb-1">{dayName}</span>
                                        <span className="text-xs text-slate-500 mb-2">{formattedDate}</span>
                                        <Icon className={`h-8 w-8 ${info.color} my-2`} />
                                        <div className="flex items-center space-x-2 text-sm font-bold">
                                            <span className="text-red-500">{day.max}°</span>
                                            <span className="text-blue-500">{day.min}°</span>
                                        </div>
                                        <div className="flex items-center mt-2 text-xs text-slate-500">
                                            <CloudRain className="h-3 w-3 mr-1" />
                                            {day.precip}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
