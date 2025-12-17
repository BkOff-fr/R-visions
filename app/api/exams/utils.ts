import path from "path";

/**
 * Get the path to data files within the project
 * Uses DATA_DIR environment variable or defaults to ./data
 */
export function getDataPath(...segments: string[]): string {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  return path.join(dataDir, ...segments);
}

/**
 * Validate that a path stays within the allowed base directory
 * Prevents path traversal attacks
 */
export function validatePathSecurity(
  targetPath: string,
  baseDir: string,
): void {
  const normalized = path.normalize(targetPath);
  const normalizedBase = path.normalize(baseDir);

  if (!normalized.startsWith(normalizedBase)) {
    throw new Error("Unauthorized data path access");
  }
}
