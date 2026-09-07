export const assuranceStates = [
  "unknown",
  "planned",
  "implemented_unverified",
  "validated",
  "partially_effective",
  "failed",
  "stale",
  "not_applicable",
  "risk_accepted",
] as const;

export type AssuranceState = (typeof assuranceStates)[number];
export type VerificationAuthority =
  | "consultant_verified"
  | "deterministic_tool"
  | "ai_proposed"
  | "unverified";

export interface AssuranceInput {
  controlStatus: "planned" | "implemented" | "not_applicable";
  validationOutcome: "not_run" | "passed" | "partial" | "failed";
  evidenceCollectedAt?: string;
  reviewDueAt?: string;
  evaluatedAt: string;
  authority: VerificationAuthority;
}

export interface AssuranceResult {
  state: AssuranceState;
  reason: string;
}

export function evaluateAssurance(input: AssuranceInput): AssuranceResult {
  const dates = [input.evaluatedAt, input.evidenceCollectedAt, input.reviewDueAt].filter(
    (value): value is string => value !== undefined,
  );
  if (dates.some((value) => Number.isNaN(Date.parse(value)))) {
    return { state: "unknown", reason: "Assurance input contains a malformed date." };
  }

  if (input.controlStatus === "not_applicable") {
    return { state: "not_applicable", reason: "Control is not applicable to this scope." };
  }

  if (input.controlStatus === "planned") {
    return { state: "planned", reason: "Control is planned but not implemented." };
  }

  const isTrustedAuthority =
    input.authority === "consultant_verified" ||
    input.authority === "deterministic_tool";
  if (!isTrustedAuthority) {
    return {
      state: "implemented_unverified",
      reason: "Unverified or AI-proposed input cannot establish authoritative assurance.",
    };
  }

  if (input.validationOutcome === "failed") {
    return { state: "failed", reason: "The latest validation failed." };
  }

  if (input.validationOutcome === "partial") {
    return {
      state: "partially_effective",
      reason: "The latest validation was incomplete or only partially successful.",
    };
  }

  const hasEvidence = input.evidenceCollectedAt !== undefined;
  const hasReviewDate = input.reviewDueAt !== undefined;

  if (
    input.validationOutcome === "passed" &&
    hasEvidence &&
    hasReviewDate &&
    Date.parse(input.evaluatedAt) > Date.parse(input.reviewDueAt!)
  ) {
    return { state: "stale", reason: "Supporting evidence is past its review date." };
  }

  if (
    input.validationOutcome === "passed" &&
    hasEvidence &&
    hasReviewDate &&
    isTrustedAuthority
  ) {
    return {
      state: "validated",
      reason:
        input.authority === "consultant_verified"
          ? "Passing validation is supported by fresh consultant-verified evidence."
          : "Passing validation is supported by fresh deterministic-tool evidence.",
    };
  }

  if (input.controlStatus === "implemented") {
    return {
      state: "implemented_unverified",
      reason: "Control implementation lacks current trusted validation evidence.",
    };
  }

  return {
    state: "unknown",
    reason: "Available information does not establish an authoritative assurance state.",
  };
}
