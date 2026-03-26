"use client";

import { useEffect, useMemo, useState } from "react";
import { generateDrafts, type Draft } from "@/shared/api/drafts";
import {
  analyzeTicketTriage,
  type TicketTriageResponse,
} from "@/shared/api/tickets";
import { listOrganizationMembers } from "@/shared/api/organizations";
import { useAuth } from "@/features/auth/store/useAuth";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Textarea from "@/shared/ui/Textarea";
import { useToast } from "@/shared/ui/toast";

const sources = [
  { value: "chat", label: "Chat" },
  { value: "commit", label: "Commit" },
  { value: "scrape", label: "Scrape" },
  { value: "manual", label: "Manual" },
];

const triageModes = [
  { value: "hybrid", label: "Hybrid AI" },
  { value: "heuristic", label: "Heuristic" },
];

type DraftGeneratorProps = {
  onGenerated?: (createdDraftIds?: string[]) => void;
};

type CandidateOwnerDraft = {
  id: string;
  name: string;
  role: string;
  skillsText: string;
  email?: string;
  source: "org";
};

function inferOwnerProfile(role: string, name: string, email?: string) {
  const normalized = role.trim().toLowerCase();
  const hint = `${name} ${email ?? ""}`.trim().toLowerCase();

  if (hint.includes("backend")) {
    return {
      role: "backend",
      skillsText: "api, authentication, server, payments",
    };
  }
  if (hint.includes("frontend")) {
    return {
      role: "frontend",
      skillsText: "ui, forms, admin ui, dashboard",
    };
  }
  if (hint.includes("mobile")) {
    return {
      role: "mobile",
      skillsText: "ios, android, login, auth",
    };
  }
  if (normalized === "owner" || normalized === "admin") {
    return {
      role: "operations",
      skillsText: "triage, operations",
    };
  }
  return {
    role: normalized || "member",
    skillsText: "",
  };
}

function buildOwnerDraft(
  id: string,
  name: string,
  memberRole: string,
  email?: string,
): CandidateOwnerDraft {
  const profile = inferOwnerProfile(memberRole, name, email);
  return {
    id,
    name,
    role: profile.role,
    skillsText: profile.skillsText,
    email,
    source: "org",
  };
}

function dedupeOwnerDrafts(owners: CandidateOwnerDraft[]) {
  const seen = new Set<string>();
  return owners.filter((owner) => {
    const key = owner.email?.toLowerCase() || owner.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildFallbackOwner(user: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): CandidateOwnerDraft {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
  return {
    id: user.id,
    name,
    role: "operations",
    skillsText: "triage, operations",
    email: user.email,
    source: "org",
  };
}

function describeOwnerPool(owners: CandidateOwnerDraft[]) {
  const specialistCount = owners.filter((owner) => {
    const normalizedRole = owner.role.trim().toLowerCase();
    return ["backend", "frontend", "mobile"].includes(normalizedRole);
  }).length;

  if (specialistCount >= 3) {
    return "Seeded specialists are available from your real org members and can still be edited before analysis.";
  }
  if (owners.length > 1) {
    return "Candidate owners come from your organization membership and can be adjusted before analysis.";
  }
  return "Only a small owner roster is available right now. Re-run org seeding if you want dedicated backend, frontend, and mobile specialists.";
}

function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "high":
      return "border-[rgba(244,111,126,0.45)] text-[#ffb8c1] bg-[rgba(244,111,126,0.14)]";
    case "medium":
      return "border-[rgba(239,157,115,0.45)] text-[#ffd0b2] bg-[rgba(239,157,115,0.14)]";
    default:
      return "border-[rgba(89,219,181,0.45)] text-[#9ff4de] bg-[rgba(89,219,181,0.14)]";
  }
}

function effortBadgeClass(effort: string) {
  switch (effort) {
    case "large":
      return "border-[rgba(244,111,126,0.45)] text-[#ffb8c1] bg-[rgba(244,111,126,0.14)]";
    case "medium":
      return "border-[rgba(110,185,255,0.52)] text-[#b7d8ff] bg-[rgba(110,185,255,0.16)]";
    default:
      return "border-[rgba(89,219,181,0.45)] text-[#9ff4de] bg-[rgba(89,219,181,0.14)]";
  }
}

function duplicateRiskBadgeClass(risk: "low" | "medium" | "high") {
  switch (risk) {
    case "high":
      return "border-[rgba(244,111,126,0.45)] text-[#ffb8c1] bg-[rgba(244,111,126,0.14)]";
    case "medium":
      return "border-[rgba(239,157,115,0.45)] text-[#ffd0b2] bg-[rgba(239,157,115,0.14)]";
    default:
      return "border-[rgba(89,219,181,0.45)] text-[#9ff4de] bg-[rgba(89,219,181,0.14)]";
  }
}

function recommendedActionLabel(
  action:
    | "create_draft"
    | "link_existing"
    | "merge_into_existing"
    | "reopen_existing",
) {
  switch (action) {
    case "merge_into_existing":
      return "Merge Into Existing";
    case "reopen_existing":
      return "Reopen Existing";
    case "link_existing":
      return "Link Existing";
    default:
      return "Create New Draft";
  }
}

function insightPreview(reasons?: string[]) {
  return reasons?.[0] ?? "No supporting detail was generated.";
}

export default function DraftGenerator({ onGenerated }: DraftGeneratorProps) {
  const { token, orgId, ready, user } = useAuth();
  const { pushToast } = useToast();
  const [rawInput, setRawInput] = useState("");
  const [context, setContext] = useState("");
  const [productArea, setProductArea] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [analysisMode, setAnalysisMode] = useState<"heuristic" | "hybrid">("hybrid");
  const [source, setSource] = useState("chat");
  const [maxDrafts, setMaxDrafts] = useState(3);
  const [candidateOwners, setCandidateOwners] = useState<CandidateOwnerDraft[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TicketTriageResponse | null>(null);
  const [analysisKey, setAnalysisKey] = useState<string | null>(null);
  const [draftGeneratedKey, setDraftGeneratedKey] = useState<string | null>(null);
  const [duplicateOverrideAccepted, setDuplicateOverrideAccepted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  useEffect(() => {
    if (!ready || !token || !orgId) return;

    let isMounted = true;
    setIsLoadingContext(true);

    Promise.allSettled([listOrganizationMembers(token, orgId, orgId)])
      .then((responses) => {
        if (!isMounted) return;

        const membersResponse = responses[0];
        if (membersResponse.status === "fulfilled") {
          const memberOwners = dedupeOwnerDrafts(
            membersResponse.value
              .filter((member) => member.user)
              .map((member) => {
                const name =
                  `${member.user?.firstName ?? ""} ${member.user?.lastName ?? ""}`.trim() ||
                  member.user?.email ||
                  "Team Member";
                return buildOwnerDraft(
                  member.user?.id ?? member.id,
                  name,
                  member.role,
                  member.user?.email,
                );
              }),
          );

          setCandidateOwners(
            memberOwners.length
              ? memberOwners
              : user
                ? [buildFallbackOwner(user)]
                : [],
          );
        } else if (user) {
          setCandidateOwners([buildFallbackOwner(user)]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingContext(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ready, token, orgId, user]);

  const reportCount = useMemo(
    () =>
      rawInput
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean).length,
    [rawInput],
  );

  const advancedContext = useMemo(() => {
    const parts = [
      context.trim(),
      productArea.trim() ? `Product area: ${productArea.trim()}` : "",
      environment.trim() ? `Environment: ${environment.trim()}` : "",
    ].filter(Boolean);
    return parts.join(" | ");
  }, [context, environment, productArea]);

  const currentInputKey = useMemo(
    () =>
      JSON.stringify({
        rawInput,
        context,
        productArea,
        environment,
        analysisMode,
        source,
        maxDrafts,
        candidateOwners,
      }),
    [
      candidateOwners,
      analysisMode,
      context,
      environment,
      maxDrafts,
      productArea,
      rawInput,
      source,
    ],
  );

  const analysisReady = Boolean(analysis && analysisKey === currentInputKey);
  const hasStaleAnalysis = Boolean(
    analysis && analysisKey && analysisKey !== currentInputKey,
  );
  const draftGeneratedForCurrentInput = draftGeneratedKey === currentInputKey;
  const currentStep = draftGeneratedForCurrentInput ? 3 : analysisReady ? 2 : 1;
  const currentDecisionSnapshot =
    analysisReady && analysis
      ? {
          ...analysis,
          intake: {
            rawInput,
            context: context.trim() || undefined,
            productArea: productArea.trim() || undefined,
            environment: environment.trim() || undefined,
            analysisMode,
            source,
          },
        }
      : undefined;
  const blockingDuplicateRecommendation = analysisReady
    ? analysis?.recommendations.find(
        (recommendation) =>
          recommendation.duplicateRisk === "high" &&
          recommendation.recommendedAction !== "create_draft",
      )
    : undefined;
  const canGenerateDrafts =
    analysisReady &&
    (!blockingDuplicateRecommendation || duplicateOverrideAccepted);

  useEffect(() => {
    setDuplicateOverrideAccepted(false);
  }, [analysisKey, currentInputKey]);

  const updateCandidateOwner = (
    id: string,
    field: "role" | "skillsText",
    value: string,
  ) => {
    setCandidateOwners((current) =>
      current.map((owner) =>
        owner.id === id ? { ...owner, [field]: value } : owner,
      ),
    );
  };

  const onAnalyze = async () => {
    if (!token || !orgId) {
      pushToast({
        title: "Missing organization context",
        description: "Log in again before analyzing issue intake.",
        tone: "error",
      });
      return;
    }

    const reports = rawInput
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!reports.length) {
      pushToast({
        title: "Nothing to analyze",
        description: "Add at least one issue report before running decision support.",
        tone: "error",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await analyzeTicketTriage(token, orgId, {
        rawReports: reports,
        mode: analysisMode,
        candidateOwners: candidateOwners.map((owner) => ({
          id: owner.id,
          name: owner.name,
          role: owner.role.trim() || undefined,
          skills: owner.skillsText
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        })),
        context: {
          productArea: productArea.trim() || undefined,
          environment: environment.trim() || undefined,
        },
      });

      setAnalysis(response);
      setAnalysisKey(currentInputKey);
      setDraftGeneratedKey(null);
      setDuplicateOverrideAccepted(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to analyze issues.";
      pushToast({
        title: "Analysis failed",
        description: message,
        tone: "error",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !orgId) {
      pushToast({
        title: "Missing organization context",
        description: "Log in again before generating drafts.",
        tone: "error",
      });
      return;
    }
    if (!rawInput.trim()) {
      pushToast({
        title: "Issue intake is empty",
        description: "Paste issue notes before generating drafts.",
        tone: "error",
      });
      return;
    }
    if (!analysisReady) {
      pushToast({
        title: "Analyze before drafting",
        description: "Run decision support first so the draft is generated from a reviewed recommendation.",
        tone: "error",
      });
      return;
    }
    if (blockingDuplicateRecommendation && !duplicateOverrideAccepted) {
      pushToast({
        title: "Duplicate risk is high",
        description: "Review the recommended existing ticket or explicitly acknowledge the override.",
        tone: "error",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateDrafts(
        token,
        {
          source,
          rawInput,
          context: advancedContext || undefined,
          maxDrafts,
          decisionSnapshot: currentDecisionSnapshot,
        },
        orgId
      );
      const createdDrafts: Draft[] = Array.isArray(response)
        ? response
        : response.data ?? [];
      pushToast({
        title: "Drafts generated",
        description:
          "Review the queue below and compare the drafts against the decision support output.",
        tone: "success",
      });
      setDraftGeneratedKey(currentInputKey);
      onGenerated?.(createdDrafts.map((draft) => String(draft.id)));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate drafts.";
      pushToast({
        title: "Draft generation failed",
        description: message,
        tone: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">
              Guided Flow
            </p>
            <h4 className="mt-1 text-base font-semibold text-[var(--mm-bone)]">
              Intake first, decision second, draft third
            </h4>
            <p className="mt-1 text-xs text-[var(--mm-mist)]">
              Keep one issue intake in focus, decide how it should be handled, then generate drafts from the reviewed result.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={currentStep >= 1 ? "mm-pill" : "rounded-full border border-[var(--mm-border)] px-3 py-1.5 text-[var(--mm-mist)]"}>
              1. Intake
            </span>
            <span className={currentStep >= 2 ? "mm-pill" : "rounded-full border border-[var(--mm-border)] px-3 py-1.5 text-[var(--mm-mist)]"}>
              2. Decision
            </span>
            <span className={currentStep >= 3 ? "mm-pill" : "rounded-full border border-[var(--mm-border)] px-3 py-1.5 text-[var(--mm-mist)]"}>
              3. Draft
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-[var(--mm-border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
            {reportCount} report{reportCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-[var(--mm-border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
            {candidateOwners.length} owner candidate{candidateOwners.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--mm-border)] bg-[rgba(8,11,18,0.42)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">
              Step 1
            </p>
            <h4 className="mt-1 text-base font-semibold text-[var(--mm-bone)]">
              Capture the issue intake
            </h4>
            <p className="mt-1 text-xs text-[var(--mm-mist)]">
              Paste the messy report, add only the minimum context, then move into analysis.
            </p>
          </div>
          <Button
            label={showAdvanced ? "Hide Advanced Context" : "Advanced Context"}
            type="button"
            variant="ghost"
            className="px-3 py-2 text-xs"
            onClick={() => setShowAdvanced((current) => !current)}
          />
        </div>

        <div className="mt-4 grid gap-4">
          <Textarea
            label="Issue intake"
            id="draft-raw-input"
            placeholder="Paste incident notes, chat context, or one issue per line..."
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            hint="This same intake powers both decision support and draft generation."
          />
          <Input
            label="Context notes (optional)"
            id="draft-context"
            placeholder="Teams, release window, customer impact..."
            value={context}
            onChange={(event) => setContext(event.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              options={sources}
            />
            <Select
              label="Analysis mode"
              value={analysisMode}
              onChange={(event) =>
                setAnalysisMode(event.target.value as "heuristic" | "hybrid")
              }
              options={triageModes}
            />
            <Input
              label="Max drafts"
              type="number"
              min={1}
              max={10}
              className="w-full"
              value={maxDrafts}
              onChange={(event) => setMaxDrafts(Number(event.target.value))}
            />
          </div>
        </div>

        {showAdvanced ? (
          <div className="mt-4 rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Product area"
                placeholder="Authentication, dashboard, billing..."
                value={productArea}
                onChange={(event) => setProductArea(event.target.value)}
              />
              <Input
                label="Environment"
                placeholder="production"
                value={environment}
                onChange={(event) => setEnvironment(event.target.value)}
              />
            </div>

            <div className="mt-4 rounded-xl border border-[var(--mm-border)] bg-[rgba(8,11,18,0.42)] px-4 py-3 text-xs text-[var(--mm-mist)]">
              Historical ticket memory is pulled automatically from your organization in the backend. Only owner routing stays editable here.
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-xs text-[var(--mm-mist)]">
                {describeOwnerPool(candidateOwners)}
              </div>
              {isLoadingContext ? (
                <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-xs text-[var(--mm-mist)]">
                  Loading candidate owners...
                </div>
              ) : null}
              {candidateOwners.map((owner) => (
                <div
                  key={owner.id}
                  className="rounded-xl border border-[var(--mm-border)] bg-[rgba(8,11,18,0.42)] p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--mm-bone)]">{owner.name}</p>
                      <p className="mt-1 text-xs text-[var(--mm-mist)]">{owner.email ?? owner.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[var(--mm-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                        Org
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Role"
                      placeholder="backend, frontend, mobile..."
                      value={owner.role}
                      onChange={(event) =>
                        updateCandidateOwner(owner.id, "role", event.target.value)
                      }
                    />
                    <Input
                      label="Skills"
                      placeholder="api, payments, auth"
                      value={owner.skillsText}
                      onChange={(event) =>
                        updateCandidateOwner(owner.id, "skillsText", event.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      ) : null}
      <section className="rounded-xl border border-[var(--mm-border)] bg-[rgba(8,11,18,0.42)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">
              Step 2
            </p>
            <h4 className="mt-1 text-base font-semibold text-[var(--mm-bone)]">
              Review decision support
            </h4>
            <p className="mt-1 text-xs text-[var(--mm-mist)]">
              Validate the routing recommendation before you ask the system to draft anything.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              label={isAnalyzing ? "Analyzing..." : analysisReady ? "Re-analyze Intake" : "Analyze Intake"}
              type="button"
              variant="ghost"
              disabled={isAnalyzing || !rawInput.trim()}
              onClick={onAnalyze}
            />
          </div>
        </div>

        {!analysis ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--mm-border)] px-4 py-5 text-sm text-[var(--mm-mist)]">
            Run analysis to generate priority, owner, effort, and historical matches from the issue intake.
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {hasStaleAnalysis ? (
              <div className="rounded-xl border border-[rgba(239,157,115,0.35)] bg-[rgba(239,157,115,0.08)] px-4 py-3 text-xs text-[#ffd0b2]">
                The intake changed after the last analysis. Re-run decision support before generating drafts.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${priorityBadgeClass(analysis.summary.highestPriority)}`}
              >
                Highest {analysis.summary.highestPriority}
              </span>
              <span className="rounded-full border border-[var(--mm-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                {analysis.summary.mode === "hybrid" ? "Hybrid mode" : "Heuristic mode"}
              </span>
              <span className="rounded-full border border-[var(--mm-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                {analysis.summary.reasoningSource === "llm_rewritten"
                  ? "LLM reasoning"
                  : analysis.summary.reasoningSource === "heuristic_fallback"
                    ? "Heuristic fallback"
                    : "Heuristic reasoning"}
              </span>
              <span className="rounded-full border border-[var(--mm-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                {analysis.summary.reportCount} report{analysis.summary.reportCount === 1 ? "" : "s"}
              </span>
            </div>

            {analysis.recommendations.map((recommendation, index) => (
              <div
                key={`${recommendation.rawReport}-${index}`}
                className="rounded-2xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-3xl">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">
                      Report {index + 1}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--mm-bone)]">
                      {recommendation.rawReport}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--mm-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                    Confidence {(recommendation.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--mm-border)] bg-[rgba(8,11,18,0.58)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                        Recommended next move
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--mm-bone)]">
                        {recommendedActionLabel(recommendation.recommendedAction)}
                        {recommendation.recommendedTargetTicket?.id
                          ? ` with #${recommendation.recommendedTargetTicket.id}`
                          : ""}
                      </p>
                      {recommendation.recommendedTargetTicket ? (
                        <p className="mt-1 text-sm text-[var(--mm-mist)]">
                          {recommendation.recommendedTargetTicket.title}
                          {recommendation.recommendedTargetTicket.status
                            ? ` • ${recommendation.recommendedTargetTicket.status}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${duplicateRiskBadgeClass(recommendation.duplicateRisk)}`}
                    >
                      {recommendation.duplicateRisk} duplicate risk
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[var(--mm-mist)]">
                    {insightPreview(recommendation.recommendedActionReasoning)}
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-3">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                        Priority
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${priorityBadgeClass(recommendation.priority)}`}
                        >
                          {recommendation.priority}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--mm-mist)]">
                        {insightPreview(recommendation.priorityReasoning)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-3">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                        Owner
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--mm-bone)]">
                        {recommendation.suggestedOwner?.name ?? "No confident owner suggestion"}
                      </p>
                      <p className="mt-2 text-sm text-[var(--mm-mist)]">
                        {insightPreview(recommendation.ownerReasoning)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-3">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                        Effort
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${effortBadgeClass(recommendation.effortEstimate)}`}
                        >
                          {recommendation.effortEstimate}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--mm-mist)]">
                        {insightPreview(recommendation.effortReasoning)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <details className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-3">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--mm-bone)]">
                        Why this recommendation
                      </summary>
                      <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--mm-mist)]">
                        {(recommendation.recommendedActionReasoning ?? []).map((reason) => (
                          <p key={reason}>- {reason}</p>
                        ))}
                      </div>
                    </details>
                    <details className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-3">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--mm-bone)]">
                        Owner and priority details
                      </summary>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2 text-sm text-[var(--mm-mist)]">
                          {(recommendation.priorityReasoning ?? []).map((reason) => (
                            <p key={reason}>- {reason}</p>
                          ))}
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-[var(--mm-mist)]">
                          {(recommendation.ownerReasoning ?? []).map((reason) => (
                            <p key={reason}>- {reason}</p>
                          ))}
                        </div>
                      </div>
                    </details>
                    <details className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-3 lg:col-span-2">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--mm-bone)]">
                        Historical memory and effort
                      </summary>
                      <div className="mt-3 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                        <div className="flex flex-col gap-2 text-sm text-[var(--mm-mist)]">
                          {(recommendation.effortReasoning ?? []).map((reason) => (
                            <p key={reason}>- {reason}</p>
                          ))}
                        </div>
                        {recommendation.matchedPastTickets.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {recommendation.matchedPastTickets.map((ticket) => (
                              <div
                                key={`${ticket.id ?? ticket.title}-${ticket.similarityReason}`}
                                className="rounded-lg border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2"
                              >
                                <p className="text-sm font-semibold text-[var(--mm-bone)]">
                                  {ticket.id ? `#${ticket.id} - ` : ""}
                                  {ticket.title}
                                </p>
                                <p className="mt-1 text-xs text-[var(--mm-mist)]">
                                  {ticket.similarityReason}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--mm-mist)]">
                            No strong historical matches were found.
                          </p>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--mm-border)] bg-[rgba(8,11,18,0.42)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">
              Step 3
            </p>
            <h4 className="mt-1 text-base font-semibold text-[var(--mm-bone)]">
              Generate drafts from the reviewed analysis
            </h4>
            <p className="mt-1 text-xs text-[var(--mm-mist)]">
              Draft creation stays locked to the current analysis so the queue reflects a reviewed recommendation, not raw intake alone.
            </p>
          </div>
          <Button
            label={
              isGenerating
                ? "Generating..."
                : blockingDuplicateRecommendation
                  ? "Create Draft Anyway"
                  : "Generate Drafts From This Analysis"
            }
            type="submit"
            disabled={isGenerating || !rawInput.trim() || !canGenerateDrafts}
          />
        </div>

        {!analysisReady ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--mm-border)] px-4 py-5 text-sm text-[var(--mm-mist)]">
            Complete Step 2 first. Draft generation unlocks only after the current intake has been analyzed.
          </div>
        ) : null}

        {blockingDuplicateRecommendation ? (
          <div className="mt-4 rounded-xl border border-[rgba(244,111,126,0.35)] bg-[rgba(244,111,126,0.08)] p-4">
            <p className="text-sm font-semibold text-[#ffb8c1]">
              Duplicate risk is high. Recommended action: {recommendedActionLabel(blockingDuplicateRecommendation.recommendedAction)}
              {blockingDuplicateRecommendation.recommendedTargetTicket?.id
                ? ` with #${blockingDuplicateRecommendation.recommendedTargetTicket.id}`
                : ""}
            </p>
            <p className="mt-2 text-xs text-[#ffd6dc]">
              This intake strongly overlaps with an existing ticket, so draft creation is gated until you explicitly acknowledge the override.
            </p>
            <label className="mt-4 flex items-start gap-3 text-sm text-[var(--mm-bone)]">
              <input
                type="checkbox"
                checked={duplicateOverrideAccepted}
                onChange={(event) => setDuplicateOverrideAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--mm-border)] bg-transparent"
              />
              <span>I reviewed the duplicate warning and still want to create a new draft.</span>
            </label>
          </div>
        ) : analysisReady ? (
          <div className="mt-4 rounded-xl border border-[var(--mm-border)] bg-[rgba(89,219,181,0.08)] px-4 py-3 text-sm text-[#9ff4de]">
            No strong duplicate warning is blocking draft generation for this intake.
          </div>
        ) : null}

        {draftGeneratedForCurrentInput ? (
          <div className="mt-4 rounded-xl border border-[var(--mm-border)] bg-[rgba(89,219,181,0.08)] px-4 py-3 text-sm text-[#9ff4de]">
            Drafts were generated for this intake. Review the queue below to approve or reject them.
          </div>
        ) : null}
      </section>
    </form>
  );
}
