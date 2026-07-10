import { appendFile, mkdir } from "fs/promises";
import path from "path";

const LOG_ROOT = path.join(process.cwd(), "storage", "logs");

type Level = "info" | "warn" | "error";

function todayFile(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}.log`;
}

/**
 * Appends a structured JSON line to a daily log file under storage/logs.
 * Never throws — logging failures must not break request handling.
 */
export async function writeLog(
  level: Level,
  scope: string,
  message: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await mkdir(LOG_ROOT, { recursive: true });
    const line =
      JSON.stringify({
        ts: new Date().toISOString(),
        level,
        scope,
        message,
        ...(meta ? { meta } : {}),
      }) + "\n";
    await appendFile(path.join(LOG_ROOT, todayFile()), line, "utf8");
  } catch (err) {
    console.error("LOGGER ERROR", err);
  }
}

export const logger = {
  info: (scope: string, message: string, meta?: Record<string, unknown>) =>
    writeLog("info", scope, message, meta),
  warn: (scope: string, message: string, meta?: Record<string, unknown>) =>
    writeLog("warn", scope, message, meta),
  error: (scope: string, message: string, meta?: Record<string, unknown>) =>
    writeLog("error", scope, message, meta),
};
