"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Table, TableCell, TableRow } from "@/shared/ui/Table";
import { createProduct, getProducts } from "@/shared/api/products";
import { useAuth } from "@/features/auth/store/useAuth";

type Product = {
  id: number;
  name: string;
  domain?: string | null;
  description?: string | null;
};

export default function ProductsPage() {
  const { token, orgId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const refresh = async () => {
    if (!token || !orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getProducts(token, orgId);
      setProducts(response.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load products.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !orgId) return;
    refresh();
  }, [token, orgId]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !orgId) {
      setError("Missing organization context. Please log in again.");
      return;
    }
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!domain.trim()) {
      setError("Domain is required.");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createProduct(token, orgId, {
        name: name.trim(),
        domain: domain.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDomain("");
      setDescription("");
      await refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create product.";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again or select an org.
        </div>
      ) : null}

      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Product Registry</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Manage product scope for agent execution</h3>
        <p className="mt-1 text-sm text-[var(--mm-mist)]">Products define context boundaries for tickets, integrations, and automated actions.</p>
      </section>

      <Card id="product-create" eyebrow="Create" title="Add product">
        <form className="flex flex-col gap-3" onSubmit={onCreate}>
          <Input
            label="Product name"
            placeholder="Customer dashboard"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Domain"
            placeholder="app.example.com"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="What this product covers"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          ) : null}
          <div>
            <Button
              label={isCreating ? "Creating..." : "Create Product"}
              type="submit"
              disabled={isCreating}
            />
          </div>
        </form>
      </Card>

      {!isLoading && products.length > 0 ? (
        <Card eyebrow="Next Step" title="Connect integrations to a product">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Products are configured. Connect GitHub, Slack, or other channels to begin automated intake.
            </p>
            <Link
              href="/admin/integrations"
              className="inline-flex items-center rounded-xl border border-[var(--mm-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--mm-glow)] transition hover:border-[var(--mm-border-strong)]"
            >
              Open Integrations
            </Link>
          </div>
        </Card>
      ) : null}

      <Table columns={4} headers={["ID", "Name", "Domain", "Description"]}>
        {isLoading ? <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">Loading products...</div> : null}
        {!isLoading && products.length === 0 ? (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">No products yet.</div>
        ) : null}
        {products.map((product) => (
          <TableRow key={product.id} columns={4}>
            <TableCell label="ID" className="text-[var(--mm-bone)]">
              {product.id}
            </TableCell>
            <TableCell label="Name" className="text-[var(--mm-mist)]">
              {product.name}
            </TableCell>
            <TableCell label="Domain" className="text-[var(--mm-mist)]">
              {product.domain ?? "—"}
            </TableCell>
            <TableCell label="Description" className="text-[var(--mm-mist)]">
              {product.description ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
