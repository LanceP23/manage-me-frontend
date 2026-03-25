import { apiClient } from "@/shared/api/client";

type Draft = {
  id: string;
  title: string;
  confidence?: number | null;
  status?: string | null;
};

type DraftListResponse = {
  data: Draft[];
};

type GenerateDraftsPayload = {
  source: string;
  rawInput: string;
  context?: string;
  maxDrafts?: number;
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

export function generateDrafts(
  token: string,
  payload: GenerateDraftsPayload,
  orgId?: string
) {
  return apiClient.post<{ data: Draft[] }>(
    "/tickets/generate-drafts",
    payload,
    { token, orgId }
  );
}
