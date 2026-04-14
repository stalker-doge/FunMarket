"use client";

import { useState, useTransition } from "react";
import { createMarketAction } from "@/actions/markets";
import { cn } from "@/lib/utils";
import { MARKET_CATEGORIES } from "@/lib/categories";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Eye,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const OUTCOME_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

type Step = 1 | 2 | 3;

interface FormData {
  question: string;
  description: string;
  category: string;
  imageUrl: string;
  closesAt: string;
  outcomes: string[];
}

const STEPS = [
  { num: 1, label: "Details" },
  { num: 2, label: "Outcomes" },
  { num: 3, label: "Preview" },
];

export default function NewMarketPage() {
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<FormData>({
    question: "",
    description: "",
    category: "other",
    imageUrl: "",
    closesAt: "",
    outcomes: ["", ""],
  });

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function updateOutcome(index: number, value: string) {
    const updated = [...form.outcomes];
    updated[index] = value;
    setForm((prev) => ({ ...prev, outcomes: updated }));
    setError(null);
  }

  function addOutcome() {
    if (form.outcomes.length >= 8) return;
    setForm((prev) => ({ ...prev, outcomes: [...prev.outcomes, ""] }));
  }

  function removeOutcome(index: number) {
    if (form.outcomes.length <= 2) return;
    setForm((prev) => ({ ...prev, outcomes: prev.outcomes.filter((_, i) => i !== index) }));
  }

  function validateStep(s: Step): string | null {
    if (s === 1) {
      if (!form.question.trim()) return "Question is required";
      if (form.question.trim().length < 5) return "Question must be at least 5 characters";
      return null;
    }
    if (s === 2) {
      const valid = form.outcomes.filter((o) => o.trim());
      if (valid.length < 2) return "At least 2 outcomes are required";
      return null;
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < 3) setStep((step + 1) as Step);
  }

  function goBack() {
    setError(null);
    if (step > 1) setStep((step - 1) as Step);
  }

  function handleSubmit() {
    const validOutcomes = form.outcomes.filter((o) => o.trim());
    if (validOutcomes.length < 2) {
      setError("At least 2 outcomes are required");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("question", form.question.trim());
      if (form.description.trim()) fd.set("description", form.description.trim());
      if (form.closesAt) fd.set("closesAt", form.closesAt);
      if (form.category) fd.set("category", form.category);
      if (form.imageUrl.trim()) fd.set("imageUrl", form.imageUrl.trim());
      validOutcomes.forEach((o, i) => {
        fd.set(`outcome_${i}`, o.trim());
      });

      const result = await createMarketAction(fd);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  const selectedCat = MARKET_CATEGORIES.find((c) => c.value === form.category) || MARKET_CATEGORIES[MARKET_CATEGORIES.length - 1];

  return (
    <div className="mx-auto max-w-xl">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Create Market
        </h1>
        <p className="text-muted-foreground mt-1">Set up a new prediction market</p>
      </div>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (s.num < step) {
                  setError(null);
                  setStep(s.num as Step);
                }
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                step === s.num
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : s.num < step
                  ? "bg-success/10 text-success border border-success/30 cursor-pointer hover:bg-success/20"
                  : "text-muted-foreground border border-transparent"
              )}
            >
              {s.num < step ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                  {s.num}
                </span>
              )}
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="mt-6">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                Question <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.question}
                onChange={(e) => updateField("question", e.target.value)}
                placeholder="Who will win the hotdog eating contest?"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                Description (optional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                placeholder="Add rules or context for this market..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {MARKET_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => updateField("category", cat.value)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 border",
                      form.category === cat.value
                        ? "border-current"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
                    )}
                    style={
                      form.category === cat.value
                        ? { color: cat.color, borderColor: `${cat.color}40`, backgroundColor: `${cat.color}10` }
                        : undefined
                    }
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                Image URL (optional)
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => updateField("imageUrl", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              {form.imageUrl && (
                <div className="mt-2 h-32 rounded-xl overflow-hidden border border-border">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                Closing Date (optional)
              </label>
              <input
                type="datetime-local"
                value={form.closesAt}
                onChange={(e) => updateField("closesAt", e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Step 2: Outcomes */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground">Outcomes</label>
                <button
                  type="button"
                  onClick={addOutcome}
                  disabled={form.outcomes.length >= 8}
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add outcome
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Define the possible outcomes for this market (2-8). Each gets equal starting probability.
              </p>
              <div className="space-y-3">
                {form.outcomes.map((outcome, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="h-10 w-3 rounded-lg shrink-0"
                      style={{
                        backgroundColor: OUTCOME_COLORS[i % 8],
                        boxShadow: `0 0 8px ${OUTCOME_COLORS[i % 8]}40`,
                      }}
                    />
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => updateOutcome(i, e.target.value)}
                      placeholder={`Outcome ${i + 1}`}
                      className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                    {form.outcomes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOutcome(i)}
                        className="text-muted-foreground hover:text-danger transition-colors p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Eye className="h-4 w-4" />
              Preview how your market will appear
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
              {form.imageUrl && (
                <div className="h-32 w-full overflow-hidden bg-muted/30">
                  <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold leading-tight text-base">
                    {form.question || "Untitled Market"}
                  </h3>
                  <span className="shrink-0 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary">
                    Open
                  </span>
                </div>
                {form.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                    {form.description}
                  </p>
                )}
                <div className="space-y-2.5">
                  {form.outcomes.filter((o) => o.trim()).map((outcome, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: OUTCOME_COLORS[i % 8] }}
                      />
                      <div className="flex-1 h-6 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white"
                          style={{
                            width: `${100 / form.outcomes.filter((o) => o.trim()).length}%`,
                            backgroundColor: OUTCOME_COLORS[i % 8],
                            minWidth: "2rem",
                          }}
                        >
                          {(100 / form.outcomes.filter((o) => o.trim()).length).toFixed(0)}%
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-24 truncate">{outcome}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border"
                    style={{
                      color: selectedCat.color,
                      borderColor: `${selectedCat.color}40`,
                      backgroundColor: `${selectedCat.color}10`,
                    }}
                  >
                    {selectedCat.label}
                  </span>
                  {form.closesAt && (
                    <span>Closes {new Date(form.closesAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-danger/10 border border-danger/30 p-4 text-sm text-danger font-medium flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-danger/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold">!</span>
            </div>
            <span>{error}</span>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium hover:bg-muted/50 transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-70"
            >
              <Sparkles className="h-4 w-4" />
              {isPending ? "Creating..." : "Create Market"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
