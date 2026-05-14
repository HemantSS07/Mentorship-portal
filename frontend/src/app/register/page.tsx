"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy /register route — redirects to the new unified auth landing page.
 */
export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>Redirecting…</p>
    </div>
  );
}
