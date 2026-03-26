import { apiClient } from "@/shared/api/client";

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  assigneeId?: string | null;
  description?: string | null;
};

type TicketListResponse = {
  data: Ticket[];
};

type TicketUpdatePayload = {
  status?: string;
  priority?: string;
};

export type TicketTriagePastTicket = {
  id?: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  ownerHint?: string;
};

export type TicketTriageCandidateOwner = {
  id: string;
  name: string;
  role?: string;
  skills?: string[];
};

export type TicketTriageRequest = {
  rawReports: string[];
  pastTickets?: TicketTriagePastTicket[];
  candidateOwners?: TicketTriageCandidateOwner[];
  mode?: "heuristic" | "hybrid" | "ai_only";
  context?: {
    productArea?: string;
    environment?: string;
  };
};

export type TicketTriageRecommendation = {
  rawReport: string;
  priority: "low" | "medium" | "high";
  priorityReasoning: string[];
  suggestedOwner: {
    id: string;
    name: string;
  } | null;
  ownerReasoning: string[];
  effortEstimate: "small" | "medium" | "large";
  effortReasoning: string[];
  duplicateRisk: "low" | "medium" | "high";
  recommendedAction:
    | "create_draft"
    | "link_existing"
    | "merge_into_existing"
    | "reopen_existing";
  recommendedActionReasoning: string[];
  recommendedTargetTicket: {
    id?: string;
    title: string;
    status?: string;
  } | null;
  matchedPastTickets: Array<{
    id?: string;
    title: string;
    status?: string;
    similarityReason: string;
  }>;
  confidence: number;
};

export type TicketTriageResponse = {
  summary: {
    reportCount: number;
    highestPriority: "low" | "medium" | "high";
    mode: "heuristic" | "hybrid" | "ai_only";
    reasoningSource:
      | "heuristic"
      | "llm_rewritten"
      | "heuristic_fallback"
      | "ai_full";
  };
  recommendations: TicketTriageRecommendation[];
};

export async function getTickets(token: string, orgId?: string) {
  const response = await apiClient.get<TicketListResponse | Ticket[]>(
    "/tickets",
    { token, orgId }
  );
  if (Array.isArray(response)) {
    return { data: response };
  }
  return response;
}

export function getTicketById(token: string, id: string, orgId?: string) {
  return apiClient.get<Ticket>(`/tickets/${id}`, { token, orgId });
}

export function updateTicket(
  token: string,
  id: string,
  payload: TicketUpdatePayload,
  orgId?: string
) {
  return apiClient.patch<Ticket>(`/tickets/${id}`, payload, { token, orgId });
}

export function analyzeTicketTriage(
  token: string,
  orgId: string,
  payload: TicketTriageRequest
) {
  return apiClient.post<TicketTriageResponse>("/tickets/triage/analyze", payload, {
    token,
    orgId,
  });
}
