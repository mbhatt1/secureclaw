[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / MarkdownConfigSchema

# Variable: MarkdownConfigSchema

> `const` **MarkdownConfigSchema**: `ZodOptional`\<`ZodObject`\<\{ `tables`: `ZodOptional`\<`ZodEnum`\<\{ `bullets`: `"bullets"`; `code`: `"code"`; `off`: `"off"`; \}\>\>; \}, `$strict`\>\>

Defined in: [config/zod-schema.core.ts:151](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/zod-schema.core.ts#L151)

Core configuration validation schemas and utilities.

Key schemas:

- DmPolicySchema/GroupPolicySchema: Access control validation
- MarkdownConfigSchema: Markdown rendering options
- normalizeAllowFrom: Normalize allowlist configuration
