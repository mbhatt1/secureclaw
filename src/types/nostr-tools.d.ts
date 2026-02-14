declare module "nostr-tools" {
  // Used as both type and value (new SimplePool(), type annotations: pool: SimplePool)
  export type SimplePool = any;
  export const SimplePool: any;

  // Used as values (called as functions)
  export const finalizeEvent: any;
  export const getPublicKey: any;
  export const verifyEvent: any;

  // Used as value (nip19.npubEncode, nip19.decode, etc.)
  export const nip19: any;

  // Used as type only (import type { Event })
  export type Event = any;
}

declare module "nostr-tools/nip04" {
  // Used as values (called as functions)
  export const decrypt: any;
  export const encrypt: any;
}
