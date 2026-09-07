import { describe, expect, it, vi } from "vitest";
import {
  attachInitialGraphFit,
  createSemanticPositions,
  runInitialGraphLayout,
} from "../../src/web/graph-runtime.js";

describe("attachInitialGraphFit", () => {
  it("fits the complete graph after layout and after the first paint", () => {
    const elements = { kind: "all-elements" };
    const fit = vi.fn();
    let layoutStopped: (() => void) | undefined;
    let painted: (() => void) | undefined;
    const core = {
      elements: () => elements,
      fit,
      one: (_event: "layoutstop", callback: () => void) => {
        layoutStopped = callback;
      },
    };

    attachInitialGraphFit(core, (callback) => {
      painted = callback;
      return 1;
    });
    layoutStopped?.();
    painted?.();

    expect(fit).toHaveBeenCalledTimes(2);
    expect(fit).toHaveBeenNthCalledWith(1, elements, 96);
    expect(fit).toHaveBeenNthCalledWith(2, elements, 96);
  });

  it("subscribes to the new layout before starting it", () => {
    const order: string[] = [];
    const core = {
      elements: () => ({}),
      fit: vi.fn(),
      one: () => {
        order.push("core-subscribe");
      },
      layout: () => ({
        one: (_event: "layoutstop", _callback: () => void) => {
          order.push("layout-subscribe");
        },
        run: () => {
          order.push("run");
        },
      }),
    };

    runInitialGraphLayout(core, { name: "fcose" }, () => 1);

    expect(order).toEqual(["layout-subscribe", "run"]);
  });

  it("places assurance entities in stable semantic columns without overlap", () => {
    const positions = createSemanticPositions([
      { id: "objective", type: "business_objective" },
      { id: "app", type: "application" },
      { id: "risk-a", type: "risk" },
      { id: "risk-b", type: "risk" },
      { id: "control", type: "control" },
      { id: "test", type: "validation_activity" },
      { id: "evidence", type: "evidence" },
      { id: "requirement", type: "requirement" },
      { id: "framework", type: "framework" },
    ]);

    expect(positions.objective.x).toBeLessThan(positions.app.x);
    expect(positions.app.x).toBeLessThan(positions["risk-a"].x);
    expect(positions["risk-a"].x).toBeLessThan(positions.control.x);
    expect(positions.control.x).toBeLessThan(positions.test.x);
    expect(positions.test.x).toBeLessThan(positions.evidence.x);
    expect(positions.evidence.x).toBeLessThan(positions.requirement.x);
    expect(positions.requirement.x).toBeLessThan(positions.framework.x);
    expect(Math.abs(positions["risk-a"].y - positions["risk-b"].y)).toBeGreaterThanOrEqual(160);
    expect(createSemanticPositions([{ id: "app", type: "application" }])).toEqual({
      app: { x: 0, y: 0 },
    });
  });
});
