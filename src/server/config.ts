import { win32 as path } from "node:path";

export interface RuntimeEnvironment {
  EIDOS_DATABASE_PATH?: string;
  LOCALAPPDATA?: string;
}

export function resolveDatabasePath(
  environment: RuntimeEnvironment,
  workingDirectory: string,
): string {
  const configuredPath = environment.EIDOS_DATABASE_PATH?.trim();
  if (configuredPath !== undefined && configuredPath.length > 0) {
    return path.resolve(workingDirectory, configuredPath);
  }
  const localAppData = environment.LOCALAPPDATA?.trim();
  if (localAppData !== undefined && localAppData.length > 0) {
    return path.resolve(localAppData, "Eidos", "eidos.sqlite");
  }
  return path.resolve(workingDirectory, "local-data", "eidos.sqlite");
}
