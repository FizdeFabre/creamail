"use client";
import { useRouter } from "next/navigation";
import { useUserSession } from "./useUserSession";
import { useEffect } from "react";

export function useRedirectIfAuthenticated() {
    const { session, loading } = useUserSession();
    const router = useRouter();

    useEffect(() => {
        if (!loading && session) {
            router.replace("/dashboard");
        }
    }, [session, loading, router]);
}