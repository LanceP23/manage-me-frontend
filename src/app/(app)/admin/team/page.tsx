"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Button from "@/shared/ui/Button";
import { Table, TableCell, TableRow } from "@/shared/ui/Table";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  addOrganizationMember,
  listOrganizationMembers,
  type OrganizationMember,
} from "@/shared/api/organizations";
import { createUser, listUsers } from "@/shared/api/users";
import { useAuth } from "@/features/auth/store/useAuth";

const roleOptionsOwner = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const roleOptionsAdmin = [
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

export default function TeamPage() {
  const { token, orgId, orgRole, ready } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  const isOwner = (orgRole ?? "").toLowerCase() === "owner";
  const roleOptions = isOwner ? roleOptionsOwner : roleOptionsAdmin;

  const refreshMembers = async () => {
    if (!token || !orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await listOrganizationMembers(token, orgId, orgId);
      setMembers(response ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load team members.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    refreshMembers();
  }, [ready, token, orgId]);

  const roleCounts = useMemo(() => {
    return members.reduce<Record<string, number>>((acc, member) => {
      const key = member.role || "member";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [members]);

  const onInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !orgId) {
      setError("Missing organization context. Please log in again.");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError("First name, last name, email, and password are required.");
      return;
    }

    setIsInviting(true);
    setError(null);
    try {
      let userId: string | null = null;
      try {
        const createdUser = await createUser(token, orgId, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });
        userId = createdUser.id;
      } catch (createError) {
        const message =
          createError instanceof Error ? createError.message : "User creation failed.";
        if (!message.toLowerCase().includes("already exists")) {
          throw createError;
        }
        const users = await listUsers(token, orgId);
        const existing = users.find(
          (user) => user.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (!existing) {
          throw createError;
        }
        userId = existing.id;
      }

      await addOrganizationMember(token, orgId, orgId, {
        userId,
        role,
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setRole("member");
      await refreshMembers();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to invite member.";
      setError(message);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Team Management</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Invite users and assign workspace roles</h3>
        <p className="mt-1 text-sm text-[var(--mm-mist)]">
          Control who can operate drafts, integrations, and agent execution.
        </p>
      </section>

      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again.
        </div>
      ) : null}
      {error ? <div className="mm-panel px-5 py-4 text-sm text-red-200">{error}</div> : null}

      <div className="mm-grid cols-2">
        <Card eyebrow="Invite" title="Add team member">
          <form className="flex flex-col gap-3" onSubmit={onInvite}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              label="Temporary password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Select
              label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              options={roleOptions}
            />
            <div>
              <Button
                label={isInviting ? "Inviting..." : "Invite Member"}
                type="submit"
                disabled={isInviting}
              />
            </div>
          </form>
        </Card>

        <Card eyebrow="Roles" title="Current distribution">
          {isLoading ? (
            <Skeleton lines={4} />
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Total members</span>
                <span className="font-semibold text-[var(--mm-bone)]">{members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Owners</span>
                <span className="font-semibold text-[var(--mm-bone)]">{roleCounts.owner ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Admins</span>
                <span className="font-semibold text-[var(--mm-bone)]">{roleCounts.admin ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Members</span>
                <span className="font-semibold text-[var(--mm-bone)]">{roleCounts.member ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Viewers</span>
                <span className="font-semibold text-[var(--mm-bone)]">{roleCounts.viewer ?? 0}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Table columns={5} headers={["Name", "Email", "Role", "Status", "Joined"]}>
        {isLoading ? (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">Loading members...</div>
        ) : null}
        {!isLoading && members.length === 0 ? (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">No members found.</div>
        ) : null}
        {members.map((member) => (
          <TableRow key={member.id} columns={5}>
            <TableCell label="Name" className="text-[var(--mm-bone)]">
              {member.user ? `${member.user.firstName} ${member.user.lastName}` : "Unknown"}
            </TableCell>
            <TableCell label="Email" className="text-[var(--mm-mist)]">
              {member.user?.email ?? "—"}
            </TableCell>
            <TableCell label="Role" className="text-[var(--mm-mist)]">
              {member.role}
            </TableCell>
            <TableCell label="Status" className="text-[var(--mm-mist)]">
              {member.user?.isActive ? "Active" : "Inactive"}
            </TableCell>
            <TableCell label="Joined" className="text-[var(--mm-mist)]">
              {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
