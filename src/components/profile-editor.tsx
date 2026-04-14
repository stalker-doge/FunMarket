"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { updateDisplayNameAction } from "@/actions/profile";
import { cn } from "@/lib/utils";
import { Pencil, Check, X } from "lucide-react";

interface ProfileEditorProps {
  displayName: string;
}

export function ProfileEditor({ displayName }: ProfileEditorProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEditing() {
    setName(displayName);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
    setName(displayName);
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Display name cannot be empty");
      return;
    }
    if (trimmed.length > 40) {
      setError("Max 40 characters");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateDisplayNameAction(trimmed);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          maxLength={40}
          className="text-2xl font-bold bg-background border border-primary/50 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button
          onClick={save}
          disabled={isPending}
          className="h-8 w-8 rounded-lg bg-success/10 border border-success/30 flex items-center justify-center hover:bg-success/20 transition-colors"
        >
          {isPending ? (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-success/30 border-t-success animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-success" />
          )}
        </button>
        <button
          onClick={cancel}
          disabled={isPending}
          className="h-8 w-8 rounded-lg bg-danger/10 border border-danger/30 flex items-center justify-center hover:bg-danger/20 transition-colors"
        >
          <X className="h-4 w-4 text-danger" />
        </button>
        {error && (
          <span className="text-xs text-danger font-medium">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-2xl font-bold">{displayName}</h1>
      <button
        onClick={startEditing}
        className="h-7 w-7 rounded-lg border border-border bg-muted/30 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200"
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
