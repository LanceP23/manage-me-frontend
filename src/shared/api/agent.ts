import { apiClient } from "@/shared/api/client";

type AgentActionResult = {
  executed: boolean;
  action?: string;
  confidence?: number;
  error?: string | null;
};

type AgentDecision = {
  execute?: boolean;
  confidence?: number;
  rationale?: string;
  actions?: Array<{ type: string; payload: Record<string, unknown> }>;
};

type AgentResponse = {
  dryRun?: boolean;
  decision?: AgentDecision;
  results: AgentActionResult[];
  message?: string;
};

type AgentAutoExecutePayload = {
  context: string;
  payload?: Record<string, unknown>;
  allowedActions?: string[];
  dryRun?: boolean;
  minConfidence?: number;
  maxActions?: number;
  source?: string;
};

type AgentExecutePayload = {
  actions: Array<{ type: string; payload: Record<string, unknown> }>;
  dryRun?: boolean;
  decision?: {
    confidence?: number;
    rationale?: string;
    promptVersion?: string;
    source?: string;
  };
};

export function autoExecuteAgent(
  token: string,
  orgId: string,
  body: AgentAutoExecutePayload
) {
  return apiClient.post<AgentResponse>("/agent/auto-execute", body, {
    token,
    orgId,
  });
}

export function executeAgent(
  token: string,
  orgId: string,
  body: AgentExecutePayload
) {
  return apiClient.post<AgentResponse>("/agent/execute", body, {
    token,
    orgId,
  });
}
