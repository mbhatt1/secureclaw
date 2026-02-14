[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / approveDevicePairing

# Function: approveDevicePairing()

> **approveDevicePairing**(`requestId`, `baseDir?`): `Promise`\<\{ `device`: `PairedDevice`; `requestId`: `string`; \} \| `null`\>

Defined in: [infra/device-pairing.ts:297](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/device-pairing.ts#L297)

Device pairing management utilities.
Used for managing multi-device authentication flows.

- approveDevicePairing: Approve a pending device pairing request
- listDevicePairing: List all pending device pairing requests
- rejectDevicePairing: Reject a pending device pairing request

## Parameters

### requestId

`string`

### baseDir?

`string`

## Returns

`Promise`\<\{ `device`: `PairedDevice`; `requestId`: `string`; \} \| `null`\>
