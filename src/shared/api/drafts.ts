import { apiClient } from "@/shared/api/client";
import type { TicketTriageResponse } from "@/shared/api/tickets";

export type DraftDecisionSnapshot = TicketTriageResponse & {
  intake?: {
    rawInput?: string;
    context?: string;
    productArea?: string;
    environment?: string;
    source?: string;
  };
};

export type Draft = {
  id: string | number;
  title: string;
  description?: string | null;
  priority?: string | null;
  source?: string | null;
  confidence?: number | null;
  status?: string | null;
  approvalStatus?: string | null;
  approvedTicketId?: number | null;
  rejectedAt?: string | null;
  decisionSnapshot?: DraftDecisionSnapshot | null;
  assignedTo?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  product?: {
    id: number;
    name?: string | null;
  } | null;
};

export type DraftAuditEntry = {
  id: number;
  action: string;
  overrides?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  approvedTicket?: {
    id: number;
    title: string;
    status?: string | null;
  } | null;
};

type DraftListResponse = {
  data: Draft[];
};

type GenerateDraftsPayload = {
  source: string;
  rawInput: string;
  context?: string;
  maxDrafts?: number;
  decisionSnapshot?: DraftDecisionSnapshot;
};

export async function getDrafts(token: string, orgId?: string) {
  const response = await apiClient.get<DraftListResponse | Draft[]>(
    "/tickets/drafts",
    { token, orgId }
  );
  if (Array.isArray(response)) {
    return { data: response };
  }
  return response;
}

export function approveDraft(token: string, id: string, orgId?: string) {
  return apiClient.post<Draft>(`/tickets/drafts/${id}/approve`, undefined, {
    token,
    orgId,
  });
}

export function rejectDraft(token: string, id: string, orgId?: string) {
  return apiClient.post<Draft>(`/tickets/drafts/${id}/reject`, undefined, {
    token,
    orgId,
  });
}

export function getDraftById(token: string, id: string, orgId?: string) {
  return apiClient.get<Draft>(`/tickets/drafts/${id}`, { token, orgId });
}

export function getDraftAudit(token: string, id: string, orgId?: string) {
  return apiClient.get<DraftAuditEntry[]>(`/tickets/drafts/${id}/audit`, {
    token,
    orgId,
  });
}

export function mergeDraftIntoExisting(
  token: string,
  id: string,
  payload: { targetTicketId: number; mergedById?: string },
  orgId?: string
) {
  return apiClient.post<{
    draft: Draft;
    mergedIntoTicket: { id: number; title: string; status?: string | null };
  }>(`/tickets/drafts/${id}/merge-existing`, payload, {
    token,
    orgId,
  });
}

export function generateDrafts(
  token: string,
  payload: GenerateDraftsPayload,
  orgId?: string
) {
  return apiClient.post<Draft[] | { data: Draft[] }>(
    "/tickets/generate-drafts",
    payload,
    { token, orgId }
  );
}
