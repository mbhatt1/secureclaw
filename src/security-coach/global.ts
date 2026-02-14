// ---------------------------------------------------------------------------
// Security Coach — Global Singleton Accessor
//
// Provides a lazy accessor for the security coach hooks instance so that
// channel monitors and the inbound message pipeline can use the coach
// without requiring it to be injected through every call-site.
// ---------------------------------------------------------------------------

import type { SecurityCoachHooks } from "./hooks.js";

let globalHooks: SecurityCoachHooks | null = null;
let initialized = false;

/** Register the global security coach hooks instance (called from the gateway). */
export function setGlobalSecurityCoachHooks(hooks: SecurityCoachHooks): void {
  globalHooks = hooks;
  initialized = true;
}

/** Get the global security coach hooks instance (returns null if not initialized). */
export function getGlobalSecurityCoachHooks(): SecurityCoachHooks | null {
  return globalHooks;
}

/** Returns true if the security coach has been initialized (even if hooks are null). */
export function isSecurityCoachInitialized(): boolean {
  return initialized;
}
