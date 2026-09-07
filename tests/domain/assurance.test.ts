import { describe, expect, it } from "vitest";
import { evaluateAssurance } from "../../src/domain/assurance.js";

const baseline = {
  controlStatus: "implemented" as const,
  validationOutcome: "passed" as const,
  evidenceCollectedAt: "2026-09-01T00:00:00.000Z",
  reviewDueAt: "2026-12-01T00:00:00.000Z",
  evaluatedAt: "2026-09-06T00:00:00.000Z",
  authority: "consultant_verified" as const,
};

describe("evaluateAssurance", () => {
  it("marks a control validated only when a passing validation has fresh verified evidence", () => {
    expect(evaluateAssurance(baseline)).toEqual({
      state: "validated",
      reason: "Passing validation is supported by fresh consultant-verified evidence.",
    });
  });

  it("marks otherwise valid evidence stale after its review date", () => {
    expect(
      evaluateAssurance({
        ...baseline,
        reviewDueAt: "2026-09-05T00:00:00.000Z",
      }).state,
    ).toBe("stale");
  });

  it("never allows AI-proposed evidence to establish any authoritative assurance result", () => {
    expect(
      evaluateAssurance({ ...baseline, authority: "ai_proposed" }).state,
    ).toBe("implemented_unverified");
    expect(
      evaluateAssurance({
        ...baseline,
        authority: "ai_proposed",
        validationOutcome: "failed",
      }).state,
    ).toBe("implemented_unverified");
  });

  it("fails closed when assurance dates are malformed", () => {
    expect(
      evaluateAssurance({ ...baseline, reviewDueAt: "not-a-date" }).state,
    ).toBe("unknown");
  });

  it("marks a failed validation as failed", () => {
    expect(
      evaluateAssurance({ ...baseline, validationOutcome: "failed" }).state,
    ).toBe("failed");
  });

  it("marks an inconclusive validation as partially effective", () => {
    expect(
      evaluateAssurance({ ...baseline, validationOutcome: "partial" }).state,
    ).toBe("partially_effective");
  });

  it("preserves planned and not-applicable control states", () => {
    expect(
      evaluateAssurance({
        ...baseline,
        controlStatus: "planned",
        validationOutcome: "not_run",
      }).state,
    ).toBe("planned");
    expect(
      evaluateAssurance({
        ...baseline,
        controlStatus: "not_applicable",
      }).state,
    ).toBe("not_applicable");
  });
});
