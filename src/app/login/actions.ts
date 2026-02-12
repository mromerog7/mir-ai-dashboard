"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function signInWithOtpAction(email: string) {
    console.log("Attempting server-side login for:", email);

    try {
        // Use the SSR client to ensure cookies (PKCE verifier) are set correctly
        const supabase = await createClient();

        const headersList = await headers();
        const origin = headersList.get("origin") || "http://localhost:3000";

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false, // Only allow login if user already exists (invited)
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Supabase API Error:", error);
            return { error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("Unexpected Server Action Error:", err);
        return { error: err.message || "An unexpected error occurred" };
    }
}

export async function signInWithPasswordAction(email: string, password: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("Login Error:", error);
        return { error: error.message };
    }

    return { success: true };
}
