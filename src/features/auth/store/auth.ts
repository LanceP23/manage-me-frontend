export type StoredUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type StoredAuth = {
  token: string;
  orgId?: string | null;
  orgName?: string | null;
  orgRole?: string | null;
  user?: StoredUser | null;
};

const TOKEN_KEY = "mm_token";
const ORG_KEY = "mm_org_id";
const ORG_NAME_KEY = "mm_org_name";
const ORG_ROLE_KEY = "mm_org_role";
const USER_KEY = "mm_user";

const hasWindow = () => typeof window !== "undefined";

function setOrRemove(key: string, value?: string | null) {
  if (!hasWindow()) return;
  if (value) {
    window.localStorage.setItem(key, value);
    return;
  }
  window.localStorage.removeItem(key);
}

export function setAuth({ token, orgId, orgName, orgRole, user }: StoredAuth) {
  if (!hasWindow()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  setOrRemove(ORG_KEY, orgId);
  setOrRemove(ORG_NAME_KEY, orgName);
  setOrRemove(ORG_ROLE_KEY, orgRole);
  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    return;
  }
  window.localStorage.removeItem(USER_KEY);
}

export function clearAuth() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ORG_KEY);
  window.localStorage.removeItem(ORG_NAME_KEY);
  window.localStorage.removeItem(ORG_ROLE_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getToken() {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getOrgId() {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(ORG_KEY);
}

export function getOrgName() {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(ORG_NAME_KEY);
}

export function getOrgRole() {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(ORG_ROLE_KEY);
}

export function getUser(): StoredUser | null {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function hasAdminRole(role: string | null | undefined) {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return normalized === "owner" || normalized === "admin" || normalized === "super_admin";
}
