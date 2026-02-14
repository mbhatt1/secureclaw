[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / extractOriginalFilename

# Function: extractOriginalFilename()

> **extractOriginalFilename**(`filePath`): `string`

Defined in: [media/store.ts:37](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/media/store.ts#L37)

Extract original filename from path if it matches the embedded format.
Pattern: {original}---{uuid}.{ext} → returns "{original}.{ext}"
Falls back to basename if no pattern match, or "file.bin" if empty.

## Parameters

### filePath

`string`

## Returns

`string`
