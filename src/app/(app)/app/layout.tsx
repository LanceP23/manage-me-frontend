import type { ReactNode } from "react";
import AuthGate from "@/features/auth/components/AuthGate";
import AppShell from "@/shared/layout/AppShell";

type LayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: LayoutProps) {
  return (
    <AuthGate>
      <AppShell
        variant="app"
        title="Tickets Command Center"
        subtitle="End User"
      >
        {children}
      </AppShell>
    </AuthGate>
  );
}
