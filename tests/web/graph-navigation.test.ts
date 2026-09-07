import { describe, expect, it } from "vitest";
import {
  createGraphHistory,
  moveGraphHistory,
  pushGraphHistory,
  selectionFromSearch,
} from "../../src/web/graph-navigation.js";

describe("graph navigation history", () => {
  it("pushes selections and drops obsolete forward states", () => {
    let history = createGraphHistory(null);
    history = pushGraphHistory(history, "risk_admin_compromise");
    history = pushGraphHistory(history, "control_admin_mfa");
    history = moveGraphHistory(history, -1);
    history = pushGraphHistory(history, "validation_mfa_login");

    expect(history).toEqual({
      entries: [null, "risk_admin_compromise", "validation_mfa_login"],
      index: 2,
    });
  });

  it("clamps back and forward navigation to available states", () => {
    const initial = createGraphHistory(null);
    expect(moveGraphHistory(initial, -1)).toEqual(initial);
    const selected = pushGraphHistory(initial, "app_acme_orders");
    expect(moveGraphHistory(selected, 9).index).toBe(1);
  });

  it("restores only valid entity selections from a deep link", () => {
    const ids = new Set(["risk_admin_compromise"]);
    expect(selectionFromSearch("?entity=risk_admin_compromise", ids)).toBe("risk_admin_compromise");
    expect(selectionFromSearch("?entity=missing", ids)).toBeNull();
    expect(selectionFromSearch("", ids)).toBeNull();
  });
});
