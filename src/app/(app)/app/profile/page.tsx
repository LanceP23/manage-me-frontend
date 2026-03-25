"use client";

import Card from "@/shared/ui/Card";
import { useAuth } from "@/features/auth/store/useAuth";

export default function ProfilePage() {
  const { orgName, orgRole, user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Operator Profile</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Your workspace identity and routing preferences</h3>
      </section>

      <div className="mm-grid cols-2">
        <Card eyebrow="Profile" title="Identity">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[var(--mm-bone)]">Name</p>
              <p>{user ? `${user.firstName} ${user.lastName}` : "Unknown user"}</p>
            </div>
            <div>
              <p className="text-[var(--mm-bone)]">Role</p>
              <p>{orgRole ?? "Member"}</p>
            </div>
            <div>
              <p className="text-[var(--mm-bone)]">Email</p>
              <p>{user?.email ?? "No email available"}</p>
            </div>
            <div>
              <p className="text-[var(--mm-bone)]">Default org</p>
              <p>{orgName ?? "No organization selected"}</p>
            </div>
          </div>
        </Card>
        <Card eyebrow="Preferences" title="Signal routing">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Draft approvals</span>
              <span className="text-[var(--mm-teal)]">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Agent auto-exec</span>
              <span className="text-[var(--mm-mist)]">Manual only</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Escalations</span>
              <span className="text-[var(--mm-teal)]">Notify immediately</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
