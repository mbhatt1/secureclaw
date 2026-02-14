[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / listDevicePairing

# Function: listDevicePairing()

> **listDevicePairing**(`baseDir?`): `Promise`\<`DevicePairingList`\>

Defined in: [infra/device-pairing.ts:239](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/device-pairing.ts#L239)

Device pairing management utilities.
Used for managing multi-device authentication flows.

- approveDevicePairing: Approve a pending device pairing request
- listDevicePairing: List all pending device pairing requests
- rejectDevicePairing: Reject a pending device pairing request

## Parameters

### baseDir?

`string`

## Returns

`Promise`\<`DevicePairingList`\>
