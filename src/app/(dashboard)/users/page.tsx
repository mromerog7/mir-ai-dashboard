import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Mail, Shield, User, Hammer, Eye } from "lucide-react";
import { InviteUserSheet } from "@/components/users/invite-user-sheet";

export default async function UsersPage() {
    const supabase = await createClient();

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching profiles:", error);
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Helper to get role icon
    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield className="h-4 w-4 text-purple-400" />;
            case 'engineer': return <Hammer className="h-4 w-4 text-orange-400" />;
            case 'viewer': return <Eye className="h-4 w-4 text-blue-400" />;
            default: return <User className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-[#02457A]">Gestión de Usuarios</h1>
                <InviteUserSheet />
            </div>

            <div className="grid gap-6">
                <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
                    <CardHeader>
                        <CardTitle>Directorio de Usuarios</CardTitle>
                        <CardDescription className="text-slate-500">
                            Usuarios registrados y sus roles en la plataforma.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profiles && profiles.length > 0 ? (
                                profiles.map((profile) => (
                                    <div key={profile.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="flex items-center space-x-4">
                                            <Avatar>
                                                <AvatarImage src={profile.avatar_url || ""} />
                                                <AvatarFallback className="bg-slate-200 text-slate-600">
                                                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium leading-none text-slate-900">
                                                        {profile.full_name || "Sin nombre"}
                                                    </p>
                                                    {currentUser?.id === profile.id && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Tú</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500">{profile.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
                                                {getRoleIcon(profile.role || 'user')}
                                                <span className="text-sm capitalize text-slate-600">{profile.role || 'user'}</span>
                                            </div>
                                            <div className={`text-xs px-2 py-1 rounded-full border ${profile.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                profile.status === 'invited' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                    'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                <span className="capitalize">{profile.status || 'inactive'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    No hay usuarios registrados aun.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
