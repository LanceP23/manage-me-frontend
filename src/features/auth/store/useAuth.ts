"use client";

import { useEffect, useState } from "react";
import {
  getOrgId,
  getOrgName,
  getOrgRole,
  hasAdminRole,
  getToken,
  getUser,
  type StoredUser,
} from "@/features/auth/store/auth";

type AuthSnapshot = {
  token: string | null;
  orgId: string | null;
  orgName: string | null;
  orgRole: string | null;
  isAdmin: boolean;
  user: StoredUser | null;
  ready: boolean;
};

export function useAuth(): AuthSnapshot {
  const [snapshot, setSnapshot] = useState<AuthSnapshot>({
    token: null,
    orgId: null,
    orgName: null,
    orgRole: null,
    isAdmin: false,
    user: null,
    ready: false,
  });

  useEffect(() => {
    const orgRole = getOrgRole();
    setSnapshot({
      token: getToken(),
      orgId: getOrgId(),
      orgName: getOrgName(),
      orgRole,
      isAdmin: hasAdminRole(orgRole),
      user: getUser(),
      ready: true,
    });
  }, []);

  return snapshot;
}
