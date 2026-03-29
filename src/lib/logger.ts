const IS_DEV = import.meta.env.DEV;

const log = (level: "debug" | "info" | "warn" | "error", ...args: any[]) => {
  if (level === "debug" && !IS_DEV) return;
  console[level](`[${level.toUpperCase()}]`, ...args);
};

export const logger = {
  debug: (...args: any[]) => log("debug", ...args),
  info: (...args: any[]) => log("info", ...args),
  warn: (...args: any[]) => log("warn", ...args),
  error: (...args: any[]) => log("error", ...args),
};
