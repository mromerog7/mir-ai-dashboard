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
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-[#D6E8EE] rounded-tr-[3rem] rounded-br-[3rem] shadow-xl overflow-hidden">
                <div className="bg-[#D6E8EE] p-6 flex items-center justify-center h-[73px]">
                    <div className="relative h-12 w-40 filter invert hue-rotate-180 brightness-125 contrast-125">
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
            <main className="md:pl-72 h-full bg-slate-50">
                <Header />
                <div className="p-8 h-full overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
