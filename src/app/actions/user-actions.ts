'use server'

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function inviteUser(data: { email: string; fullName: string; role: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if current user is admin (optional, but recommended)
    // For now we trust the UI, but in production you should fetch profile and check role
    if (!user) {
        console.error("inviteUser: User not found in session", await supabase.auth.getSession());
        return { error: "No autorizado (Sesión no encontrada)" };
    }

    const adminClient = createAdminClient();

    const { data: userData, error } = await adminClient.auth.admin.inviteUserByEmail(data.email, {
        data: {
            full_name: data.fullName,
            role: data.role,
            status: 'invited'
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
    });

    if (error) {
        console.error("Error inviting user:", error);
        return { error: error.message };
    }

    // Also insert into profiles if the trigger doesn't handle invited users correctly or just to be safe
    // The trigger handles INSERT on auth.users, which inviteUserByEmail triggers.
    // However, the trigger uses raw_user_meta_data.

    revalidatePath("/users");
    return { success: true };
}

export async function updateUserRole(userId: string, role: string, status: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('profiles')
        .update({ role, status })
        .eq('id', userId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/users");
    return { success: true };
}
