import { describe, expect, it } from "vitest";
import { resolveDatabasePath } from "../../src/server/config.js";

describe("resolveDatabasePath", () => {
  it("uses the user-local application data directory by default", () => {
    expect(resolveDatabasePath(
      { LOCALAPPDATA: "C:/Users/corey/AppData/Local" },
      "C:/repo/Eidos",
    )).toBe("C:\\Users\\corey\\AppData\\Local\\Eidos\\eidos.sqlite");
  });

  it("falls back to ignored repository data when local application data is unavailable", () => {
    expect(resolveDatabasePath({}, "C:/repo/Eidos")).toBe(
      "C:\\repo\\Eidos\\local-data\\eidos.sqlite",
    );
  });

  it("resolves an explicit operator-provided database path", () => {
    expect(
      resolveDatabasePath(
        { EIDOS_DATABASE_PATH: "D:/Eidos Data/client.sqlite" },
        "C:/repo/Eidos",
      ),
    ).toBe("D:\\Eidos Data\\client.sqlite");
  });
});
