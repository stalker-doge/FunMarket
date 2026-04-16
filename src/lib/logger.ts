type LogLevel = "info" | "warn" | "error";

function formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, message, ...data };
  return JSON.stringify(entry);
}

export const logger = {
  info(message: string, data?: Record<string, unknown>) {
    console.log(formatMessage("info", message, data));
  },
  warn(message: string, data?: Record<string, unknown>) {
    console.warn(formatMessage("warn", message, data));
  },
  error(message: string, data?: Record<string, unknown>) {
    console.error(formatMessage("error", message, data));
  },
};
