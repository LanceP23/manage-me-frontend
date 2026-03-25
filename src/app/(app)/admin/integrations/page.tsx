"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/shared/ui/Card";
import StatusBadge from "@/shared/ui/StatusBadge";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Button from "@/shared/ui/Button";
import {
  createGithubIntegrationConfig,
  getIntegrationStatus,
  listGithubIntegrationConfigs,
  updateGithubIntegrationConfig,
  type GithubIntegrationConfig,
} from "@/shared/api/integrations";
import { getProducts } from "@/shared/api/products";
import { useAuth } from "@/features/auth/store/useAuth";

type IntegrationRow = {
  provider: string;
  status: "active" | "degraded" | "unknown";
  lastEventAt?: string | null;
  lastEventType?: string | null;
  lastDirection?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
};

type ProductRow = {
  id: number;
  name: string;
};

export default function IntegrationsPage() {
  const { token, orgId, ready } = useAuth();
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [githubConfigs, setGithubConfigs] = useState<GithubIntegrationConfig[]>(
    []
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState({
    productId: "",
    repoId: "",
    repoFullName: "",
    webhookSecret: "",
  });

  const isEditing = editingId !== null;

  const selectedConfig = useMemo(
    () => githubConfigs.find((config) => config.id === editingId) || null,
    [githubConfigs, editingId]
  );
  const productNameById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product.name]));
  }, [products]);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    setIsLoading(true);
    setError(null);

    getIntegrationStatus(token, orgId)
      .then((response) => {
        setRows(response.data ?? []);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load integrations.";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ready, token, orgId]);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    setIsConfigLoading(true);
    setConfigError(null);

    listGithubIntegrationConfigs(token, orgId)
      .then((response) => {
        setGithubConfigs(response.data ?? []);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load GitHub configs.";
        setConfigError(message);
      })
      .finally(() => {
        setIsConfigLoading(false);
      });
  }, [ready, token, orgId]);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    getProducts(token, orgId)
      .then((response) => {
        setProducts(response.data ?? []);
      })
      .catch(() => {
        setProducts([]);
      });
  }, [ready, token, orgId]);

  useEffect(() => {
    if (!selectedConfig) return;
    setFormState({
      productId: selectedConfig.productId?.toString() ?? "",
      repoId: selectedConfig.repoId ?? "",
      repoFullName: selectedConfig.repoFullName ?? "",
      webhookSecret: "",
    });
  }, [selectedConfig]);

  const resetForm = () => {
    setEditingId(null);
    setFormState({
      productId: "",
      repoId: "",
      repoFullName: "",
      webhookSecret: "",
    });
  };

  const reloadConfigs = async () => {
    if (!token || !orgId) return;
    const response = await listGithubIntegrationConfigs(token, orgId);
    setGithubConfigs(response.data ?? []);
  };

  const parseProductId = (value: string) => {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const onSubmitGithubConfig = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !orgId) return;

    setConfigError(null);

    const repoId = formState.repoId.trim();
    const repoFullName = formState.repoFullName.trim();
    if (!repoId && !repoFullName) {
      setConfigError("Repo ID or repo full name is required.");
      return;
    }

    if (!isEditing && !formState.webhookSecret.trim()) {
      setConfigError("Webhook secret is required for new configs.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        productId: parseProductId(formState.productId),
        repoId: repoId || undefined,
        repoFullName: repoFullName || undefined,
        webhookSecret: formState.webhookSecret.trim() || undefined,
      };

      if (isEditing && editingId !== null) {
        await updateGithubIntegrationConfig(token, orgId, editingId, payload);
      } else {
        await createGithubIntegrationConfig(token, orgId, {
          ...payload,
          webhookSecret: formState.webhookSecret.trim(),
        });
      }

      await reloadConfigs();
      resetForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save GitHub config.";
      setConfigError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Integrations</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Control inbound and outbound automation channels</h3>
        <p className="mt-1 text-sm text-[var(--mm-mist)]">
          Configure GitHub webhooks and monitor provider health before enabling broad agent execution.
        </p>
      </section>

      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again or select an org.
        </div>
      ) : null}
      {isLoading ? <div className="mm-panel px-5 py-4 text-sm text-[var(--mm-mist)]">Loading integration status...</div> : null}
      {error ? <div className="mm-panel px-5 py-4 text-sm text-red-200">{error}</div> : null}

      {!isLoading && products.length === 0 ? (
        <Card eyebrow="Prerequisite" title="Create a product first">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Integrations should be mapped to a product so ticket ingestion and automation stay scoped.
            </p>
            <Link
              href="/admin/products"
              className="inline-flex items-center rounded-xl border border-[var(--mm-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--mm-glow)] transition hover:border-[var(--mm-border-strong)]"
            >
              Open Products
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="mm-grid cols-2">
        <Card
          eyebrow="GitHub"
          title={isEditing ? "Edit webhook config" : "Add webhook config"}
        >
          <form className="flex flex-col gap-3" onSubmit={onSubmitGithubConfig}>
            <Select
              label="Product (optional)"
              value={formState.productId}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  productId: event.target.value,
                }))
              }
            >
              <option value="">All products / org-wide</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
            <Input
              label="Repo ID"
              placeholder="123456789"
              value={formState.repoId}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  repoId: event.target.value,
                }))
              }
            />
            <Input
              label="Repo Full Name"
              placeholder="owner/repo"
              value={formState.repoFullName}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  repoFullName: event.target.value,
                }))
              }
            />
            <Input
              label={
                isEditing
                  ? "Webhook Secret (leave blank to keep)"
                  : "Webhook Secret"
              }
              type="password"
              value={formState.webhookSecret}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  webhookSecret: event.target.value,
                }))
              }
              required={!isEditing}
            />
            {configError ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                {configError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                label={isSaving ? "Saving..." : isEditing ? "Update Config" : "Add Config"}
                type="submit"
                disabled={isSaving}
              />
              {isEditing ? (
                <Button
                  label="Cancel"
                  variant="ghost"
                  type="button"
                  disabled={isSaving}
                  onClick={resetForm}
                />
              ) : null}
            </div>
          </form>
          <p className="mt-3 text-xs text-[var(--mm-mist)]">
            Store one secret per repo/product. GitHub webhook secret must match this
            value.
          </p>
        </Card>

        <Card eyebrow="GitHub" title="Webhook configs">
          {isConfigLoading ? (
            <p className="text-xs text-[var(--mm-mist)]">Loading configs...</p>
          ) : null}
          {!isConfigLoading && githubConfigs.length === 0 ? (
            <p className="text-xs text-[var(--mm-mist)]">No GitHub webhook configs yet.</p>
          ) : null}
          <div className="flex flex-col gap-3">
            {githubConfigs.map((config) => (
              <div
                key={config.id}
                className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3 text-xs text-[var(--mm-mist)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--mm-bone)]">
                  <span>Config #{config.id}</span>
                  <Button
                    label="Edit"
                    variant="ghost"
                    type="button"
                    onClick={() => setEditingId(config.id)}
                  />
                </div>
                <div className="mt-2 grid gap-1">
                  <span>
                    Product:{" "}
                    {config.productId
                      ? `${productNameById.get(config.productId) ?? "Unknown"} (#${config.productId})`
                      : "—"}
                  </span>
                  <span>Repo ID: {config.repoId ?? "—"}</span>
                  <span>Repo: {config.repoFullName ?? "—"}</span>
                  <span>Updated: {new Date(config.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {!isLoading && !error && rows.length === 0 ? (
        <Card eyebrow="Integrations" title="No activity yet">
          Send a webhook or outbound message to generate status.
        </Card>
      ) : null}

      {rows.length > 0 ? (
        <div className="mm-grid cols-2">
          {rows.map((integration) => (
            <Card key={integration.provider} eyebrow="Integration" title={integration.provider}>
              <StatusBadge status={integration.status} />
              <p className="mt-2 text-xs text-[var(--mm-mist)]">
                Last event: {integration.lastEventType ?? "—"} · {integration.lastDirection ?? "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--mm-mist)]">
                Updated: {integration.lastEventAt ? new Date(integration.lastEventAt).toLocaleString() : "—"}
              </p>
              {integration.lastError ? (
                <p className="mt-2 text-xs text-red-200">Error: {integration.lastError}</p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
