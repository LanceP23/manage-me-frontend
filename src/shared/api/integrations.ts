import { apiClient } from "@/shared/api/client";

type IntegrationStatus = {
  provider: string;
  status: "active" | "degraded" | "unknown";
  lastEventAt?: string | null;
  lastEventType?: string | null;
  lastDirection?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
};

type IntegrationStatusResponse = {
  data: IntegrationStatus[];
};

export type GithubIntegrationConfig = {
  id: number;
  provider: string;
  organizationId: string;
  productId: number | null;
  repoId: string | null;
  repoFullName: string | null;
  createdAt: string;
  updatedAt: string;
};

type GithubIntegrationConfigListResponse = {
  data: GithubIntegrationConfig[];
};

export type GithubIntegrationConfigPayload = {
  productId?: number;
  repoId?: string;
  repoFullName?: string;
  webhookSecret?: string;
};

export function getIntegrationStatus(token: string, orgId: string) {
  return apiClient.get<IntegrationStatusResponse>("/integrations/status", {
    token,
    orgId,
  });
}

export function listGithubIntegrationConfigs(token: string, orgId: string) {
  return apiClient.get<GithubIntegrationConfigListResponse>(
    "/integrations/github/config",
    { token, orgId }
  );
}

export function createGithubIntegrationConfig(
  token: string,
  orgId: string,
  payload: GithubIntegrationConfigPayload
) {
  return apiClient.post<GithubIntegrationConfig>(
    "/integrations/github/config",
    payload,
    { token, orgId }
  );
}

export function updateGithubIntegrationConfig(
  token: string,
  orgId: string,
  id: number,
  payload: GithubIntegrationConfigPayload
) {
  return apiClient.patch<GithubIntegrationConfig>(
    `/integrations/github/config/${id}`,
    payload,
    { token, orgId }
  );
}
