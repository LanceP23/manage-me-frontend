"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { login } from "@/shared/api/auth";
import { hasAdminRole, setAuth } from "@/features/auth/store/auth";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      const orgs = response.user.organizations ?? [];
      const fallbackOrg = orgs[0] ?? null;
      const orgFromDefault =
        orgs.find((org) => org.id === response.user.defaultOrgId) ?? null;
      const activeOrg = orgFromDefault ?? fallbackOrg;

      if (!fallbackOrg) {
        throw new Error(
          "No organization found for this user. Contact an admin to add you."
        );
      }

      setAuth({
        token: response.access_token,
        orgId: activeOrg?.id ?? null,
        orgName: activeOrg?.name ?? null,
        orgRole: activeOrg?.role ?? null,
        user: response.user,
      });

      router.push(hasAdminRole(activeOrg?.role) ? "/admin" : "/app");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <Input
        label="Email"
        id="login-email"
        placeholder="you@company.com"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        label="Password"
        id="login-password"
        placeholder="••••••••"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <div className="flex items-center justify-between text-xs text-[var(--mm-mist)]">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--mm-teal)]" />
          Keep me signed in
        </label>
        <span className="text-[var(--mm-bone)]">Forgot password?</span>
      </div>
      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </p>
      ) : null}
      <Button
        label={isLoading ? "Signing in..." : "Sign In"}
        type="submit"
        disabled={isLoading}
      />
    </form>
  );
}
