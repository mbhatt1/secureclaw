// Lazy-load @line/bot-sdk to make it optional
type LineSdkModule = typeof import("@line/bot-sdk");
let lineSdkModulePromise: Promise<LineSdkModule> | null = null;

export async function loadLineSDK(): Promise<LineSdkModule> {
  if (!lineSdkModulePromise) {
    lineSdkModulePromise = import("@line/bot-sdk").catch((err) => {
      lineSdkModulePromise = null;
      throw new Error(
        `Optional dependency @line/bot-sdk is required for LINE messaging: ${String(err)}`,
      );
    });
  }
  return lineSdkModulePromise;
}
