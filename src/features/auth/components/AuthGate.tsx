"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrgRole, getToken, hasAdminRole } from "@/features/auth/store/auth";

type AuthGateProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export default function AuthGate({ children, requireAdmin = false }: AuthGateProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && !hasAdminRole(getOrgRole())) {
      router.replace("/app");
      return;
    }
    setReady(true);
  }, [requireAdmin, router]);

  if (!ready) {
    return (
      <div className="mm-shell flex items-center justify-center px-4 py-10">
        <div className="mm-panel px-5 py-4 text-sm text-[var(--mm-mist)]">
          Verifying session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
