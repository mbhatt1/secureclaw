declare module "@urbit/http-api" {
  // Used as both type and value (new Urbit(...), Urbit.prototype, typeof Urbit.prototype)
  export type Urbit = any;
  export const Urbit: any;
}

declare module "@urbit/aura" {
  // Used as values (called as functions)
  export const scot: any;
  export const da: any;
}
