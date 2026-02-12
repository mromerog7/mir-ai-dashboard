import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Login() {

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#111827]">
            <Card className="w-full max-w-md bg-[#1f2937] border-slate-700 text-white">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">MiR-AI ERP</CardTitle>
                    <CardDescription className="text-center text-slate-400">Ingresa tu correo para acceder</CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    );
}
