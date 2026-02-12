"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { signInWithOtpAction } from "@/app/login/actions"

export function LoginForm() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
    const router = useRouter()

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const result = await signInWithOtpAction(email)

        if (result.error) {
            console.error("Login Error:", result.error)
            setMessage({ text: result.error, type: 'error' })
        } else {
            setMessage({ text: "¡Enlace mágico enviado! Revisa tu correo.", type: 'success' })
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="usuario@grupocilar.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={loading}
                />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                    </>
                ) : (
                    "Ingresar con Magic Link"
                )}
            </Button>

            {message && (
                <p className={`mt-4 p-4 rounded-md text-center text-sm ${message.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                    {message.text}
                </p>
            )}
        </form>
    )
}
