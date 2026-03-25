import { apiClient } from "@/shared/api/client";

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive?: boolean;
};

type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export function listUsers(token: string, orgId: string) {
  return apiClient.get<UserRecord[]>("/users", { token, orgId });
}

export function createUser(
  token: string,
  orgId: string,
  payload: CreateUserPayload
) {
  return apiClient.post<UserRecord>("/users", payload, { token, orgId });
}
