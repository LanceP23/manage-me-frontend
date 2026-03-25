import { apiClient } from "@/shared/api/client";

type Product = {
  id: number;
  name: string;
  domain?: string | null;
  description?: string | null;
};

type ProductListResponse = {
  data: Product[];
};

type CreateProductPayload = {
  name: string;
  domain: string;
  description?: string;
};

type UpdateProductPayload = {
  name?: string;
  description?: string;
};

export async function getProducts(token: string, orgId: string) {
  const response = await apiClient.get<ProductListResponse | Product[]>(
    "/product",
    { token, orgId }
  );
  if (Array.isArray(response)) {
    return { data: response };
  }
  return response;
}

export function createProduct(
  token: string,
  orgId: string,
  payload: CreateProductPayload
) {
  return apiClient.post<Product>("/product", payload, { token, orgId });
}

export function updateProduct(
  token: string,
  orgId: string,
  id: number,
  payload: UpdateProductPayload
) {
  return apiClient.patch<Product>(`/product/${id}`, payload, { token, orgId });
}
