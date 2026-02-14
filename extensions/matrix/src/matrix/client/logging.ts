import { ConsoleLogger, LogService } from "@vector-im/matrix-bot-sdk";

let matrixSdkLoggingConfigured = false;
const matrixSdkBaseLogger = new ConsoleLogger();

function shouldSuppressMatrixHttpNotFound(module: string, messageOrObject: unknown[]): boolean {
  if (module !== "MatrixHttpClient") {
    return false;
  }
  return messageOrObject.some((entry) => {
    if (!entry || typeof entry !== "object") {
      return false;
    }
    return (entry as { errcode?: string }).errcode === "M_NOT_FOUND";
  });
}

export function ensureMatrixSdkLoggingConfigured(): void {
  if (matrixSdkLoggingConfigured) {
    return;
  }
  matrixSdkLoggingConfigured = true;

  LogService.setLogger({
    trace: (module: any, ...messageOrObject: any[]) =>
      matrixSdkBaseLogger.trace(module, ...messageOrObject),
    debug: (module: any, ...messageOrObject: any[]) =>
      matrixSdkBaseLogger.debug(module, ...messageOrObject),
    info: (module: any, ...messageOrObject: any[]) =>
      matrixSdkBaseLogger.info(module, ...messageOrObject),
    warn: (module: any, ...messageOrObject: any[]) =>
      matrixSdkBaseLogger.warn(module, ...messageOrObject),
    error: (module: any, ...messageOrObject: any[]) => {
      if (shouldSuppressMatrixHttpNotFound(module, messageOrObject)) {
        return;
      }
      matrixSdkBaseLogger.error(module, ...messageOrObject);
    },
  });
}
