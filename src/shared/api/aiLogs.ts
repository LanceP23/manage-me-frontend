import { apiClient, getBaseUrl } from "@/shared/api/client";

type AiLog = {
  id: string;
  promptVersion?: string;
  provider?: string;
  createdAt?: string;
};

type AiLogListResponse = {
  data: AiLog[];
};

export async function getAiLogs(token: string, orgId?: string) {
  const response = await apiClient.get<
    AiLogListResponse | { items: AiLog[] } | AiLog[]
  >("/ai-evaluation-logs", {
    token,
    orgId,
  });

  if (Array.isArray(response)) {
    return { data: response };
  }

  if ("items" in response) {
    return { data: response.items };
  }

  return response;
}

export async function exportAiLogs(token: string, orgId: string) {
  const response = await fetch(`${getBaseUrl()}/ai-evaluation-logs/export`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-org-id": orgId,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `AI log export failed (${response.status}): ${errorText || "unknown"}`
    );
  }

  return response.blob();
}
