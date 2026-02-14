[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / DmConfigSchema

# Variable: DmConfigSchema

> `const` **DmConfigSchema**: `ZodObject`\<\{ `historyLimit`: `ZodOptional`\<`ZodNumber`\>; \}, `$strict`\>

Defined in: [config/zod-schema.core.ts:91](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/zod-schema.core.ts#L91)

Core configuration validation schemas and utilities.

Key schemas:

- DmPolicySchema/GroupPolicySchema: Access control validation
- MarkdownConfigSchema: Markdown rendering options
- normalizeAllowFrom: Normalize allowlist configuration
