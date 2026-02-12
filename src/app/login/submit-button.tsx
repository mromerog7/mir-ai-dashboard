"use client";

import { useFormStatus } from "react-dom";
import { type ComponentProps } from "react";
import { Button } from "@/components/ui/button";

type Props = ComponentProps<"button"> & {
    pendingText?: string;
};

export function SubmitButton({ children, pendingText, ...props }: Props) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" aria-disabled={pending} className="w-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-700" {...props}>
            {pending ? pendingText || "Enviando..." : children || "Ingresar con Magic Link"}
        </Button>
    );
}
