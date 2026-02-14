declare module "@twurple/auth" {
  // Used as both types and values (new RefreshingAuthProvider(...), type annotations)
  export type RefreshingAuthProvider = any;
  export const RefreshingAuthProvider: any;
  export type StaticAuthProvider = any;
  export const StaticAuthProvider: any;
}

declare module "@twurple/chat" {
  // Used as both type and value (new ChatClient(...), type annotations: let client: ChatClient)
  export type ChatClient = any;
  export const ChatClient: any;

  // Used as value (LogLevel.*)
  export const LogLevel: any;
}

declare module "@twurple/api" {
  // Used as value (new ApiClient(...))
  export const ApiClient: any;
}
