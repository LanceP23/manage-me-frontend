"use client";

import { useState } from "react";
import { generateDrafts } from "@/shared/api/drafts";
import { useAuth } from "@/features/auth/store/useAuth";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Textarea from "@/shared/ui/Textarea";

const sources = [
  { value: "chat", label: "Chat" },
  { value: "commit", label: "Commit" },
  { value: "scrape", label: "Scrape" },
  { value: "manual", label: "Manual" },
];

type DraftGeneratorProps = {
  onGenerated?: () => void;
};

export default function DraftGenerator({ onGenerated }: DraftGeneratorProps) {
  const { token, orgId } = useAuth();
  const [rawInput, setRawInput] = useState("");
  const [context, setContext] = useState("");
  const [source, setSource] = useState("chat");
  const [maxDrafts, setMaxDrafts] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !orgId) {
      setError("Missing organization context. Please log in again.");
      return;
    }
    if (!rawInput.trim()) {
      setError("Please enter input for the AI to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await generateDrafts(
        token,
        {
          source,
          rawInput,
          context: context || undefined,
          maxDrafts,
        },
        orgId
      );
      setRawInput("");
      setContext("");
      onGenerated?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate drafts.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <Textarea
        label="Input for AI"
        id="draft-raw-input"
        placeholder="Paste incident notes, chat context, or commit summary..."
        value={rawInput}
        onChange={(event) => setRawInput(event.target.value)}
      />
      <Input
        label="Context (optional)"
        id="draft-context"
        placeholder="Teams or release window details"
        value={context}
        onChange={(event) => setContext(event.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Select
          label="Source"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          options={sources}
        />
        <Input
          label="Max drafts"
          type="number"
          min={1}
          max={10}
          className="w-full sm:w-28"
          value={maxDrafts}
          onChange={(event) => setMaxDrafts(Number(event.target.value))}
        />
      </div>
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      ) : null}
      <div>
        <Button
          label={isLoading ? "Generating..." : "Generate Drafts"}
          type="submit"
          disabled={isLoading || !rawInput.trim()}
        />
      </div>
    </form>
  );
}
