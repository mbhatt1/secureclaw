declare module "@lancedb/lancedb" {
  // Used as value via dynamic import (lancedb.connect(...))
  export const connect: any;

  // Used as types (LanceDB.Connection, LanceDB.Table)
  export type Connection = any;
  export type Table = any;
}
