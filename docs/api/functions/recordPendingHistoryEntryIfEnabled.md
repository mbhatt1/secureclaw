[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / recordPendingHistoryEntryIfEnabled

# Function: recordPendingHistoryEntryIfEnabled()

> **recordPendingHistoryEntryIfEnabled**\<`T`\>(`params`): `T`[]

Defined in: [auto-reply/reply/history.ts:86](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/reply/history.ts#L86)

Conversation history management utilities.
Used for tracking message context in group chats.

- buildPendingHistoryContextFromMap: Build context from history map
- clearHistoryEntries: Clear all history entries for a session
- recordPendingHistoryEntry: Record a message in conversation history
- DEFAULT_GROUP_HISTORY_LIMIT: Default number of messages to retain

## Type Parameters

### T

`T` _extends_ [`HistoryEntry`](../type-aliases/HistoryEntry.md)

## Parameters

### params

#### entry?

`T` \| `null`

#### historyKey

`string`

#### historyMap

`Map`\<`string`, `T`[]\>

#### limit

`number`

## Returns

`T`[]
