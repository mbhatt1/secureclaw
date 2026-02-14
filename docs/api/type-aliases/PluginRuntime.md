[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / PluginRuntime

# Type Alias: PluginRuntime

> **PluginRuntime** = `object`

Defined in: [plugins/runtime/types.ts:178](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L178)

Plugin runtime environment and logging interfaces.
Provides access to configuration, storage, and logging within plugins.

## Properties

### channel

> **channel**: `object`

Defined in: [plugins/runtime/types.ts:205](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L205)

#### activity

> **activity**: `object`

##### activity.get

> **get**: `GetChannelActivity`

##### activity.record

> **record**: `RecordChannelActivity`

#### commands

> **commands**: `object`

##### commands.isControlCommandMessage

> **isControlCommandMessage**: `IsControlCommandMessage`

##### commands.resolveCommandAuthorizedFromAuthorizers

> **resolveCommandAuthorizedFromAuthorizers**: `ResolveCommandAuthorizedFromAuthorizers`

##### commands.shouldComputeCommandAuthorized

> **shouldComputeCommandAuthorized**: `ShouldComputeCommandAuthorized`

##### commands.shouldHandleTextCommands

> **shouldHandleTextCommands**: `ShouldHandleTextCommands`

#### debounce

> **debounce**: `object`

##### debounce.createInboundDebouncer

> **createInboundDebouncer**: `CreateInboundDebouncer`

##### debounce.resolveInboundDebounceMs

> **resolveInboundDebounceMs**: `ResolveInboundDebounceMs`

#### discord

> **discord**: `object`

##### discord.auditChannelPermissions

> **auditChannelPermissions**: `AuditDiscordChannelPermissions`

##### discord.listDirectoryGroupsLive

> **listDirectoryGroupsLive**: `ListDiscordDirectoryGroupsLive`

##### discord.listDirectoryPeersLive

> **listDirectoryPeersLive**: `ListDiscordDirectoryPeersLive`

##### discord.messageActions

> **messageActions**: `DiscordMessageActions`

##### discord.monitorDiscordProvider

> **monitorDiscordProvider**: `MonitorDiscordProvider`

##### discord.probeDiscord

> **probeDiscord**: `ProbeDiscord`

##### discord.resolveChannelAllowlist

> **resolveChannelAllowlist**: `ResolveDiscordChannelAllowlist`

##### discord.resolveUserAllowlist

> **resolveUserAllowlist**: `ResolveDiscordUserAllowlist`

##### discord.sendMessageDiscord

> **sendMessageDiscord**: `SendMessageDiscord`

##### discord.sendPollDiscord

> **sendPollDiscord**: `SendPollDiscord`

#### groups

> **groups**: `object`

##### groups.resolveGroupPolicy

> **resolveGroupPolicy**: `ResolveChannelGroupPolicy`

##### groups.resolveRequireMention

> **resolveRequireMention**: `ResolveChannelGroupRequireMention`

#### imessage

> **imessage**: `object`

##### imessage.monitorIMessageProvider

> **monitorIMessageProvider**: `MonitorIMessageProvider`

##### imessage.probeIMessage

> **probeIMessage**: `ProbeIMessage`

##### imessage.sendMessageIMessage

> **sendMessageIMessage**: `SendMessageIMessage`

#### line

> **line**: `object`

##### line.buildTemplateMessageFromPayload

> **buildTemplateMessageFromPayload**: `BuildTemplateMessageFromPayload`

##### line.createQuickReplyItems

> **createQuickReplyItems**: `CreateQuickReplyItems`

##### line.listLineAccountIds

> **listLineAccountIds**: `ListLineAccountIds`

##### line.monitorLineProvider

> **monitorLineProvider**: `MonitorLineProvider`

##### line.normalizeAccountId

> **normalizeAccountId**: `NormalizeLineAccountId`

##### line.probeLineBot

> **probeLineBot**: `ProbeLineBot`

##### line.pushFlexMessage

> **pushFlexMessage**: `PushFlexMessage`

##### line.pushLocationMessage

> **pushLocationMessage**: `PushLocationMessage`

##### line.pushMessageLine

> **pushMessageLine**: `PushMessageLine`

##### line.pushMessagesLine

> **pushMessagesLine**: `PushMessagesLine`

##### line.pushTemplateMessage

> **pushTemplateMessage**: `PushTemplateMessage`

##### line.pushTextMessageWithQuickReplies

> **pushTextMessageWithQuickReplies**: `PushTextMessageWithQuickReplies`

##### line.resolveDefaultLineAccountId

> **resolveDefaultLineAccountId**: `ResolveDefaultLineAccountId`

##### line.resolveLineAccount

> **resolveLineAccount**: `ResolveLineAccount`

##### line.sendMessageLine

> **sendMessageLine**: `SendMessageLine`

#### media

> **media**: `object`

##### media.fetchRemoteMedia

> **fetchRemoteMedia**: `FetchRemoteMedia`

##### media.saveMediaBuffer

> **saveMediaBuffer**: `SaveMediaBuffer`

#### mentions

> **mentions**: `object`

##### mentions.buildMentionRegexes

> **buildMentionRegexes**: `BuildMentionRegexes`

##### mentions.matchesMentionPatterns

> **matchesMentionPatterns**: `MatchesMentionPatterns`

##### mentions.matchesMentionWithExplicit

> **matchesMentionWithExplicit**: `MatchesMentionWithExplicit`

#### pairing

> **pairing**: `object`

##### pairing.buildPairingReply

> **buildPairingReply**: `BuildPairingReply`

##### pairing.readAllowFromStore

> **readAllowFromStore**: `ReadChannelAllowFromStore`

##### pairing.upsertPairingRequest

> **upsertPairingRequest**: `UpsertChannelPairingRequest`

#### reactions

> **reactions**: `object`

##### reactions.removeAckReactionAfterReply

> **removeAckReactionAfterReply**: `RemoveAckReactionAfterReply`

##### reactions.shouldAckReaction

> **shouldAckReaction**: `ShouldAckReaction`

#### reply

> **reply**: `object`

##### reply.createReplyDispatcherWithTyping

> **createReplyDispatcherWithTyping**: `CreateReplyDispatcherWithTyping`

##### reply.dispatchReplyFromConfig

> **dispatchReplyFromConfig**: `DispatchReplyFromConfig`

##### reply.dispatchReplyWithBufferedBlockDispatcher

> **dispatchReplyWithBufferedBlockDispatcher**: `DispatchReplyWithBufferedBlockDispatcher`

##### reply.finalizeInboundContext

> **finalizeInboundContext**: `FinalizeInboundContext`

##### reply.formatAgentEnvelope

> **formatAgentEnvelope**: `FormatAgentEnvelope`

##### reply.formatInboundEnvelope

> **formatInboundEnvelope**: `FormatInboundEnvelope`

###### Deprecated

Prefer `BodyForAgent` + structured user-context blocks (do not build plaintext envelopes for prompts).

##### reply.resolveEffectiveMessagesConfig

> **resolveEffectiveMessagesConfig**: `ResolveEffectiveMessagesConfig`

##### reply.resolveEnvelopeFormatOptions

> **resolveEnvelopeFormatOptions**: `ResolveEnvelopeFormatOptions`

##### reply.resolveHumanDelayConfig

> **resolveHumanDelayConfig**: `ResolveHumanDelayConfig`

#### routing

> **routing**: `object`

##### routing.resolveAgentRoute

> **resolveAgentRoute**: `ResolveAgentRoute`

#### session

> **session**: `object`

##### session.readSessionUpdatedAt

> **readSessionUpdatedAt**: `ReadSessionUpdatedAt`

##### session.recordInboundSession

> **recordInboundSession**: `RecordInboundSession`

##### session.recordSessionMetaFromInbound

> **recordSessionMetaFromInbound**: `RecordSessionMetaFromInbound`

##### session.resolveStorePath

> **resolveStorePath**: `ResolveStorePath`

##### session.updateLastRoute

> **updateLastRoute**: `UpdateLastRoute`

#### signal

> **signal**: `object`

##### signal.messageActions

> **messageActions**: `SignalMessageActions`

##### signal.monitorSignalProvider

> **monitorSignalProvider**: `MonitorSignalProvider`

##### signal.probeSignal

> **probeSignal**: `ProbeSignal`

##### signal.sendMessageSignal

> **sendMessageSignal**: `SendMessageSignal`

#### slack

> **slack**: `object`

##### slack.handleSlackAction

> **handleSlackAction**: `HandleSlackAction`

##### slack.listDirectoryGroupsLive

> **listDirectoryGroupsLive**: `ListSlackDirectoryGroupsLive`

##### slack.listDirectoryPeersLive

> **listDirectoryPeersLive**: `ListSlackDirectoryPeersLive`

##### slack.monitorSlackProvider

> **monitorSlackProvider**: `MonitorSlackProvider`

##### slack.probeSlack

> **probeSlack**: `ProbeSlack`

##### slack.resolveChannelAllowlist

> **resolveChannelAllowlist**: `ResolveSlackChannelAllowlist`

##### slack.resolveUserAllowlist

> **resolveUserAllowlist**: `ResolveSlackUserAllowlist`

##### slack.sendMessageSlack

> **sendMessageSlack**: `SendMessageSlack`

#### telegram

> **telegram**: `object`

##### telegram.auditGroupMembership

> **auditGroupMembership**: `AuditTelegramGroupMembership`

##### telegram.collectUnmentionedGroupIds

> **collectUnmentionedGroupIds**: `CollectTelegramUnmentionedGroupIds`

##### telegram.messageActions

> **messageActions**: `TelegramMessageActions`

##### telegram.monitorTelegramProvider

> **monitorTelegramProvider**: `MonitorTelegramProvider`

##### telegram.probeTelegram

> **probeTelegram**: `ProbeTelegram`

##### telegram.resolveTelegramToken

> **resolveTelegramToken**: `ResolveTelegramToken`

##### telegram.sendMessageTelegram

> **sendMessageTelegram**: `SendMessageTelegram`

#### text

> **text**: `object`

##### text.chunkByNewline

> **chunkByNewline**: `ChunkByNewline`

##### text.chunkMarkdownText

> **chunkMarkdownText**: `ChunkMarkdownText`

##### text.chunkMarkdownTextWithMode

> **chunkMarkdownTextWithMode**: `ChunkMarkdownTextWithMode`

##### text.chunkText

> **chunkText**: `ChunkText`

##### text.chunkTextWithMode

> **chunkTextWithMode**: `ChunkTextWithMode`

##### text.convertMarkdownTables

> **convertMarkdownTables**: `ConvertMarkdownTables`

##### text.hasControlCommand

> **hasControlCommand**: `HasControlCommand`

##### text.resolveChunkMode

> **resolveChunkMode**: `ResolveChunkMode`

##### text.resolveMarkdownTableMode

> **resolveMarkdownTableMode**: `ResolveMarkdownTableMode`

##### text.resolveTextChunkLimit

> **resolveTextChunkLimit**: `ResolveTextChunkLimit`

#### whatsapp

> **whatsapp**: `object`

##### whatsapp.createLoginTool

> **createLoginTool**: `CreateWhatsAppLoginTool`

##### whatsapp.getActiveWebListener

> **getActiveWebListener**: `GetActiveWebListener`

##### whatsapp.getWebAuthAgeMs

> **getWebAuthAgeMs**: `GetWebAuthAgeMs`

##### whatsapp.handleWhatsAppAction

> **handleWhatsAppAction**: `HandleWhatsAppAction`

##### whatsapp.loginWeb

> **loginWeb**: `LoginWeb`

##### whatsapp.logoutWeb

> **logoutWeb**: `LogoutWeb`

##### whatsapp.logWebSelfId

> **logWebSelfId**: `LogWebSelfId`

##### whatsapp.monitorWebChannel

> **monitorWebChannel**: `MonitorWebChannel`

##### whatsapp.readWebSelfId

> **readWebSelfId**: `ReadWebSelfId`

##### whatsapp.sendMessageWhatsApp

> **sendMessageWhatsApp**: `SendMessageWhatsApp`

##### whatsapp.sendPollWhatsApp

> **sendPollWhatsApp**: `SendPollWhatsApp`

##### whatsapp.startWebLoginWithQr

> **startWebLoginWithQr**: `StartWebLoginWithQr`

##### whatsapp.waitForWebLogin

> **waitForWebLogin**: `WaitForWebLogin`

##### whatsapp.webAuthExists

> **webAuthExists**: `WebAuthExists`

---

### config

> **config**: `object`

Defined in: [plugins/runtime/types.ts:180](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L180)

#### loadConfig

> **loadConfig**: `LoadConfig`

#### writeConfigFile

> **writeConfigFile**: `WriteConfigFile`

---

### logging

> **logging**: `object`

Defined in: [plugins/runtime/types.ts:352](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L352)

#### getChildLogger()

> **getChildLogger**: (`bindings?`, `opts?`) => [`RuntimeLogger`](RuntimeLogger.md)

##### Parameters

###### bindings?

`Record`\<`string`, `unknown`\>

###### opts?

###### level?

`LogLevel`

##### Returns

[`RuntimeLogger`](RuntimeLogger.md)

#### shouldLogVerbose

> **shouldLogVerbose**: `ShouldLogVerbose`

---

### media

> **media**: `object`

Defined in: [plugins/runtime/types.ts:189](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L189)

#### detectMime

> **detectMime**: `DetectMime`

#### getImageMetadata

> **getImageMetadata**: `GetImageMetadata`

#### isVoiceCompatibleAudio

> **isVoiceCompatibleAudio**: `IsVoiceCompatibleAudio`

#### loadWebMedia

> **loadWebMedia**: `LoadWebMedia`

#### mediaKindFromMime

> **mediaKindFromMime**: `MediaKindFromMime`

#### resizeToJpeg

> **resizeToJpeg**: `ResizeToJpeg`

---

### state

> **state**: `object`

Defined in: [plugins/runtime/types.ts:359](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L359)

#### resolveStateDir

> **resolveStateDir**: `ResolveStateDir`

---

### system

> **system**: `object`

Defined in: [plugins/runtime/types.ts:184](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L184)

#### enqueueSystemEvent

> **enqueueSystemEvent**: `EnqueueSystemEvent`

#### formatNativeDependencyHint

> **formatNativeDependencyHint**: `FormatNativeDependencyHint`

#### runCommandWithTimeout

> **runCommandWithTimeout**: `RunCommandWithTimeout`

---

### tools

> **tools**: `object`

Defined in: [plugins/runtime/types.ts:200](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L200)

#### createMemoryGetTool

> **createMemoryGetTool**: `CreateMemoryGetTool`

#### createMemorySearchTool

> **createMemorySearchTool**: `CreateMemorySearchTool`

#### registerMemoryCli

> **registerMemoryCli**: `RegisterMemoryCli`

---

### tts

> **tts**: `object`

Defined in: [plugins/runtime/types.ts:197](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L197)

#### textToSpeechTelephony

> **textToSpeechTelephony**: `TextToSpeechTelephony`

---

### version

> **version**: `string`

Defined in: [plugins/runtime/types.ts:179](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L179)
