import { apiClient } from "@/shared/api/client";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

type OrganizationListResponse = {
  data: Organization[];
};

export function getOrganizations(token: string) {
  return apiClient.get<OrganizationListResponse>("/organizations", { token });
}

export type OrganizationMember = {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type AddOrganizationMemberPayload = {
  userId: string;
  role: string;
};

export function listOrganizationMembers(
  token: string,
  orgId: string,
  organizationId: string
) {
  return apiClient.get<OrganizationMember[]>(
    `/organizations/${organizationId}/members`,
    { token, orgId }
  );
}

export function addOrganizationMember(
  token: string,
  orgId: string,
  organizationId: string,
  payload: AddOrganizationMemberPayload
) {
  return apiClient.post<OrganizationMember>(
    `/organizations/${organizationId}/members`,
    payload,
    { token, orgId }
  );
}
