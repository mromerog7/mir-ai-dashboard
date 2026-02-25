import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        try {
            const supabase = await createClient();

            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error) {
                return NextResponse.redirect(`${origin}${next}`);
            } else {
                console.error("[Auth Callback] Error exchanging code:", error);
                return NextResponse.redirect(`${origin}/login?message=Auth Error: ${error.message}`);
            }
        } catch (err: any) {
            console.error("[Auth Callback] Unexpected error:", err);
            return NextResponse.redirect(`${origin}/login?message=System Error: ${err.message || String(err)}`);
        }
    } else {
        console.error("[Auth Callback] No code found in URL");
        return NextResponse.redirect(`${origin}/login?message=No code provided`);
    }
}
