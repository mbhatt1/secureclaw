[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / SecureClawConfig

# Type Alias: SecureClawConfig

> **SecureClawConfig** = `object`

Defined in: [config/types.secureclaw.ts:28](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L28)

SecureClawConfig: Main configuration object for the entire system.
Contains all channel configurations, agent settings, and system preferences.

## Properties

### agents?

> `optional` **agents**: `AgentsConfig`

Defined in: [config/types.secureclaw.ts:82](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L82)

---

### approvals?

> `optional` **approvals**: `ApprovalsConfig`

Defined in: [config/types.secureclaw.ts:89](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L89)

---

### audio?

> `optional` **audio**: `AudioConfig`

Defined in: [config/types.secureclaw.ts:86](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L86)

---

### auth?

> `optional` **auth**: `AuthConfig`

Defined in: [config/types.secureclaw.ts:35](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L35)

---

### bindings?

> `optional` **bindings**: `AgentBinding`[]

Defined in: [config/types.secureclaw.ts:84](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L84)

---

### broadcast?

> `optional` **broadcast**: `BroadcastConfig`

Defined in: [config/types.secureclaw.ts:85](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L85)

---

### browser?

> `optional` **browser**: `BrowserConfig`

Defined in: [config/types.secureclaw.ts:67](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L67)

---

### canvasHost?

> `optional` **canvasHost**: `CanvasHostConfig`

Defined in: [config/types.secureclaw.ts:96](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L96)

---

### channels?

> `optional` **channels**: `ChannelsConfig`

Defined in: [config/types.secureclaw.ts:92](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L92)

---

### commands?

> `optional` **commands**: `CommandsConfig`

Defined in: [config/types.secureclaw.ts:88](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L88)

---

### cron?

> `optional` **cron**: `CronConfig`

Defined in: [config/types.secureclaw.ts:93](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L93)

---

### database?

> `optional` **database**: `DatabaseConfig`

Defined in: [config/types.secureclaw.ts:100](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L100)

---

### diagnostics?

> `optional` **diagnostics**: `DiagnosticsConfig`

Defined in: [config/types.secureclaw.ts:59](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L59)

---

### discovery?

> `optional` **discovery**: `DiscoveryConfig`

Defined in: [config/types.secureclaw.ts:95](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L95)

---

### env?

> `optional` **env**: `object`

Defined in: [config/types.secureclaw.ts:36](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L36)

#### Index Signature

\[`key`: `string`\]: `string` \| `Record`\<`string`, `string`\> \| \{ `enabled?`: `boolean`; `timeoutMs?`: `number`; \} \| `undefined`

Sugar: allow env vars directly under env (string values only).

#### shellEnv?

> `optional` **shellEnv**: `object`

Opt-in: import missing secrets from a login shell environment (exec `$SHELL -l -c 'env -0'`).

##### shellEnv.enabled?

> `optional` **enabled**: `boolean`

##### shellEnv.timeoutMs?

> `optional` **timeoutMs**: `number`

Timeout for the login shell exec (ms). Default: 15000.

#### vars?

> `optional` **vars**: `Record`\<`string`, `string`\>

Inline env vars to apply when not already present in the process env.

---

### gateway?

> `optional` **gateway**: `GatewayConfig`

Defined in: [config/types.secureclaw.ts:98](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L98)

---

### hooks?

> `optional` **hooks**: `HooksConfig`

Defined in: [config/types.secureclaw.ts:94](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L94)

---

### logging?

> `optional` **logging**: `LoggingConfig`

Defined in: [config/types.secureclaw.ts:60](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L60)

---

### memory?

> `optional` **memory**: `MemoryConfig`

Defined in: [config/types.secureclaw.ts:99](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L99)

---

### messages?

> `optional` **messages**: `MessagesConfig`

Defined in: [config/types.secureclaw.ts:87](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L87)

---

### meta?

> `optional` **meta**: `object`

Defined in: [config/types.secureclaw.ts:29](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L29)

#### lastTouchedAt?

> `optional` **lastTouchedAt**: `string`

ISO timestamp when this config was last written.

#### lastTouchedVersion?

> `optional` **lastTouchedVersion**: `string`

Last SecureClaw version that wrote this config.

---

### models?

> `optional` **models**: `ModelsConfig`

Defined in: [config/types.secureclaw.ts:80](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L80)

---

### nodeHost?

> `optional` **nodeHost**: `NodeHostConfig`

Defined in: [config/types.secureclaw.ts:81](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L81)

---

### plugins?

> `optional` **plugins**: `PluginsConfig`

Defined in: [config/types.secureclaw.ts:79](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L79)

---

### session?

> `optional` **session**: `SessionConfig`

Defined in: [config/types.secureclaw.ts:90](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L90)

---

### skills?

> `optional` **skills**: `SkillsConfig`

Defined in: [config/types.secureclaw.ts:78](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L78)

---

### talk?

> `optional` **talk**: `TalkConfig`

Defined in: [config/types.secureclaw.ts:97](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L97)

---

### tools?

> `optional` **tools**: `ToolsConfig`

Defined in: [config/types.secureclaw.ts:83](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L83)

---

### ui?

> `optional` **ui**: `object`

Defined in: [config/types.secureclaw.ts:68](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L68)

#### assistant?

> `optional` **assistant**: `object`

##### assistant.avatar?

> `optional` **avatar**: `string`

Assistant avatar (emoji, short text, or image URL/data URI).

##### assistant.name?

> `optional` **name**: `string`

Assistant display name for UI surfaces.

#### seamColor?

> `optional` **seamColor**: `string`

Accent color for SecureClaw UI chrome (hex).

---

### update?

> `optional` **update**: `object`

Defined in: [config/types.secureclaw.ts:61](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L61)

#### channel?

> `optional` **channel**: `"stable"` \| `"beta"` \| `"dev"`

Update channel for git + npm installs ("stable", "beta", or "dev").

#### checkOnStart?

> `optional` **checkOnStart**: `boolean`

Check for updates on gateway start (npm installs only).

---

### web?

> `optional` **web**: `WebConfig`

Defined in: [config/types.secureclaw.ts:91](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L91)

---

### wizard?

> `optional` **wizard**: `object`

Defined in: [config/types.secureclaw.ts:52](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.secureclaw.ts#L52)

#### lastRunAt?

> `optional` **lastRunAt**: `string`

#### lastRunCommand?

> `optional` **lastRunCommand**: `string`

#### lastRunCommit?

> `optional` **lastRunCommit**: `string`

#### lastRunMode?

> `optional` **lastRunMode**: `"local"` \| `"remote"`

#### lastRunVersion?

> `optional` **lastRunVersion**: `string`
