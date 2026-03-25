import { apiClient } from "@/shared/api/client";

type LoginResponse = {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizations?: Array<{
      id: string;
      name: string;
      slug: string;
      role?: string;
    }>;
    defaultOrgId?: string | null;
  };
};

type LoginPayload = {
  email: string;
  password: string;
};

export function login(payload: LoginPayload) {
  return apiClient.post<LoginResponse>("/auth/login", payload);
}
