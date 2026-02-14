[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / processLineMessage

# Function: processLineMessage()

> **processLineMessage**(`text`): [`ProcessedLineMessage`](../interfaces/ProcessedLineMessage.md)

Defined in: [line/markdown-to-line.ts:384](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/line/markdown-to-line.ts#L384)

Main function: Process text for LINE output

- Extracts tables → Flex Messages
- Extracts code blocks → Flex Messages
- Strips remaining markdown
- Returns processed text + Flex Messages

## Parameters

### text

`string`

## Returns

[`ProcessedLineMessage`](../interfaces/ProcessedLineMessage.md)
