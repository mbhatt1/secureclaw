declare module "@microsoft/agents-hosting" {
  // Used as type only (import type { TurnContext })
  export type TurnContext = any;

  // Used as values via import * as sdk (sdk.MsalTokenProvider, sdk.ActivityHandler, etc.)
  export const MsalTokenProvider: any;
  export const ActivityHandler: any;
  export const authorizeJWT: any;
  export const getAuthConfigWithDefaults: any;
  export const CloudAdapter: any;
}
