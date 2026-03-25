import type { ReactNode } from "react";
import AuthGate from "@/features/auth/components/AuthGate";
import AppShell from "@/shared/layout/AppShell";

type LayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: LayoutProps) {
  return (
    <AuthGate requireAdmin>
      <AppShell
        variant="admin"
        title="AI Operations"
        subtitle="Admin Control"
      >
        {children}
      </AppShell>
    </AuthGate>
  );
}
