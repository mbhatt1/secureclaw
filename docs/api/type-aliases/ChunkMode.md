[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChunkMode

# Type Alias: ChunkMode

> **ChunkMode** = `"length"` \| `"newline"`

Defined in: [auto-reply/chunk.ts:20](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/chunk.ts#L20)

Chunking mode for outbound messages:

- "length": Split only when exceeding textChunkLimit (default)
- "newline": Prefer breaking on "soft" boundaries. Historically this split on every
  newline; now it only breaks on paragraph boundaries (blank lines) unless the text
  exceeds the length limit.
