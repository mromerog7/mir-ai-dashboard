import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import Image from "next/image";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full relative">
            {/* Sidebar - visible only on lg (1024px+) */}
            <div className="hidden h-full lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-[80] bg-[#65B017] rounded-tr-[3rem] rounded-br-[3rem] shadow-xl overflow-hidden">
                <div className="bg-[#65B017] p-6 flex items-center justify-center h-[73px]">
                    <div className="relative h-12 w-40 filter brightness-0 invert">
                        <Image
                            src="https://pub-2b7c10c04cbb4824bc36f52820ace933.r2.dev/logo/logoMiR-AI-Finalweb.png"
                            alt="MiR-AI Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
                <Sidebar />
            </div>
            <main className="lg:pl-72 h-full bg-slate-50">
                <Header />
                <div className="p-4 md:p-6 lg:p-8 h-full overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
