[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / rejectDevicePairing

# Function: rejectDevicePairing()

> **rejectDevicePairing**(`requestId`, `baseDir?`): `Promise`\<\{ `deviceId`: `string`; `requestId`: `string`; \} \| `null`\>

Defined in: [infra/device-pairing.ts:349](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/device-pairing.ts#L349)

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

`Promise`\<\{ `deviceId`: `string`; `requestId`: `string`; \} \| `null`\>
