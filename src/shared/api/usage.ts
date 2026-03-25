import { apiClient } from "@/shared/api/client";

export type UsageSummary = {
  organizationId: string;
  monthKey: string;
  plan: {
    slug: string;
    name: string;
  };
  usage: {
    aiPrompts: number;
    ticketDrafts: number;
    agentActions: number;
    commitLinks: number;
    integrationDrafts: number;
  };
  limits: {
    aiPrompts?: number;
    ticketDrafts?: number;
    agentActions?: number;
    commitLinks?: number;
    integrationDrafts?: number;
  };
};

export type UsageEvent = {
  id: string;
  kind: string;
  quantity: number;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

type UsageEventsResponse = {
  organizationId: string;
  count: number;
  events: UsageEvent[];
};

export function getUsageSummary(token: string, orgId: string) {
  return apiClient.get<UsageSummary>("/usage/summary", { token, orgId });
}

export function getUsageEvents(
  token: string,
  orgId: string,
  options?: { limit?: number; kind?: string }
) {
  const search = new URLSearchParams();
  if (options?.limit) {
    search.set("limit", String(options.limit));
  }
  if (options?.kind) {
    search.set("kind", options.kind);
  }
  const query = search.toString();
  const path = query ? `/usage/events?${query}` : "/usage/events";
  return apiClient.get<UsageEventsResponse>(path, { token, orgId });
}
