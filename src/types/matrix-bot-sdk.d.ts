declare module "@vector-im/matrix-bot-sdk" {
  // Used as both type and value (new MatrixClient(...), type annotations)
  export type MatrixClient = any;
  export const MatrixClient: any;

  // Used as values (new ConsoleLogger(), LogService.setLogger, LogService.warn)
  export const ConsoleLogger: any;
  export const LogService: any;

  // Used as type only (import type { IStorageProvider, ICryptoStorageProvider })
  export type IStorageProvider = any;
  export type ICryptoStorageProvider = any;

  // Used as values (new SimpleFsStorageProvider(...), new RustSdkCryptoStorageProvider(...))
  export const SimpleFsStorageProvider: any;
  export const RustSdkCryptoStorageProvider: any;

  // Used as value (AutojoinRoomsMixin.setupOnClient)
  export const AutojoinRoomsMixin: any;

  // Used as types only (in type positions: media.ts, send/types.ts, monitor/handler.ts, etc.)
  export type DimensionalFileInfo = any;
  export type EncryptedFile = any;
  export type FileWithThumbnailInfo = any;
  export type TimedFileInfo = any;
  export type VideoFileInfo = any;
  export type MessageEventContent = any;
  export type TextualMessageEventContent = any;
  export type LocationMessageEventContent = any;
}

declare module "@matrix-org/matrix-sdk-crypto-nodejs" {
  // Used as value (dynamic import, StoreType.Sqlite)
  export const StoreType: any;
}
