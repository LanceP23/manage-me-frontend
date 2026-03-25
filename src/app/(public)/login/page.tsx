import Card from "@/shared/ui/Card";
import LoginForm from "@/features/auth/components/LoginForm";
import { CheckCircle2, Workflow } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="mm-shell flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
      <div className="w-full max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="mm-panel p-6 md:p-8">
            <p className="mm-pill">Manage Me</p>
            <h1 className="mt-5 max-w-xl text-3xl font-semibold leading-tight text-[var(--mm-bone)] md:text-5xl">
              Ship faster with an agentic operations workspace.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[var(--mm-mist)] md:text-base">
              Route incidents, generate AI drafts, and execute workflow decisions from a single control surface.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4">
                <p className="text-xs text-[var(--mm-mist)]">Draft approvals</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">Queue visibility</p>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4">
                <p className="text-xs text-[var(--mm-mist)]">SLA risk</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">Early alerts</p>
              </div>
            </div>

            <div className="mt-8 space-y-3 text-sm text-[var(--mm-mist)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--mm-teal)]" />
                End-user tickets and admin controls in one product
              </div>
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-[var(--mm-teal)]" />
                Track queue state: queued, review, completed
              </div>
            </div>
          </section>

          <Card eyebrow="Access" title="Sign in to your workspace" className="h-fit">
            <LoginForm />
            <p className="mt-3 text-xs text-[var(--mm-mist)]">
              Access is organization-scoped and role-protected.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
