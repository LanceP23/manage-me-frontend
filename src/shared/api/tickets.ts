import { apiClient } from "@/shared/api/client";

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  assigneeId?: string | null;
};

type TicketListResponse = {
  data: Ticket[];
};

type TicketUpdatePayload = {
  status?: string;
  priority?: string;
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
