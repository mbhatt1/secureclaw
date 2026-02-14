/**
 * Standard message action names supported across channels.
 * Used for operations like pin, unpin, delete, react, etc.
 */
export { CHANNEL_MESSAGE_ACTION_NAMES } from "../channels/plugins/message-action-names.js";

/**
 * BlueBubbles-specific action names and constants for iMessage integration.
 * Includes direct message and group-specific actions.
 */
export {
  BLUEBUBBLES_ACTIONS,
  BLUEBUBBLES_ACTION_NAMES,
  BLUEBUBBLES_GROUP_ACTIONS,
} from "../channels/plugins/bluebubbles-actions.js";

/**
 * Core channel adapter types and interfaces.
 * These types define the contract for implementing custom messaging channel integrations.
 *
 * Key interfaces:
 * - ChannelPlugin: Main plugin contract for implementing a new messaging channel
 * - ChannelConfigAdapter: Configuration management for channels
 * - ChannelMessagingAdapter: Send/receive messages and handle media
 * - ChannelGatewayAdapter: HTTP endpoint handlers for webhooks
 * - ChannelAuthAdapter: Authentication flows (OAuth, QR codes, etc.)
 * - ChannelSecurityAdapter: Access control and security policies
 */
export type {
  ChannelAccountSnapshot,
  ChannelAccountState,
  ChannelAgentTool,
  ChannelAgentToolFactory,
  ChannelAuthAdapter,
  ChannelCapabilities,
  ChannelCommandAdapter,
  ChannelConfigAdapter,
  ChannelDirectoryAdapter,
  ChannelDirectoryEntry,
  ChannelDirectoryEntryKind,
  ChannelElevatedAdapter,
  ChannelGatewayAdapter,
  ChannelGatewayContext,
  ChannelGroupAdapter,
  ChannelGroupContext,
  ChannelHeartbeatAdapter,
  ChannelHeartbeatDeps,
  ChannelId,
  ChannelLogSink,
  ChannelLoginWithQrStartResult,
  ChannelLoginWithQrWaitResult,
  ChannelLogoutContext,
  ChannelLogoutResult,
  ChannelMentionAdapter,
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMessageActionName,
  ChannelMessagingAdapter,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelOutboundContext,
  ChannelOutboundTargetMode,
  ChannelPairingAdapter,
  ChannelPollContext,
  ChannelPollResult,
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelResolverAdapter,
  ChannelSecurityAdapter,
  ChannelSecurityContext,
  ChannelSecurityDmPolicy,
  ChannelSetupAdapter,
  ChannelSetupInput,
  ChannelStatusAdapter,
  ChannelStatusIssue,
  ChannelStreamingAdapter,
  ChannelThreadingAdapter,
  ChannelThreadingContext,
  ChannelThreadingToolContext,
  ChannelToolSend,
} from "../channels/plugins/types.js";

/**
 * ChannelPlugin: Main interface for implementing a messaging channel integration.
 * ChannelConfigSchema: Configuration schema with UI hints for the channel.
 */
export type { ChannelConfigSchema, ChannelPlugin } from "../channels/plugins/types.plugin.js";

/**
 * Core plugin system types.
 *
 * Key interfaces:
 * - SecureClawPluginApi: Main plugin API for creating services and tools
 * - SecureClawPluginService: Service lifecycle management
 * - AnyAgentTool: Agent tool definition (schema + execute function)
 * - ProviderAuthContext/Result: OAuth and authentication flows
 */
export type {
  AnyAgentTool,
  SecureClawPluginApi,
  SecureClawPluginService,
  SecureClawPluginServiceContext,
  ProviderAuthContext,
  ProviderAuthResult,
} from "../plugins/types.js";

/**
 * Gateway HTTP request handler types.
 * Used for implementing custom HTTP endpoints and webhooks.
 */
export type {
  GatewayRequestHandler,
  GatewayRequestHandlerOptions,
  RespondFn,
} from "../gateway/server-methods/types.js";

/**
 * Plugin runtime environment and logging interfaces.
 * Provides access to configuration, storage, and logging within plugins.
 */
export type { PluginRuntime, RuntimeLogger } from "../plugins/runtime/types.js";

/**
 * Normalizes HTTP paths for plugin routes.
 * Ensures consistent path formatting across plugins.
 */
export { normalizePluginHttpPath } from "../plugins/http-path.js";

/**
 * Registers HTTP routes for plugin endpoints.
 * Used to expose custom HTTP handlers from plugins.
 */
export { registerPluginHttpRoute } from "../plugins/http-registry.js";

/**
 * Returns an empty plugin configuration schema.
 * Useful for plugins that don't require configuration.
 */
export { emptyPluginConfigSchema } from "../plugins/config-schema.js";

/**
 * SecureClawConfig: Main configuration object for the entire system.
 * Contains all channel configurations, agent settings, and system preferences.
 */
export type { SecureClawConfig } from "../config/config.js";

/** @deprecated Use SecureClawConfig instead */
export type { SecureClawConfig as ClawdbotConfig } from "../config/config.js";

/**
 * ChannelDock: Registry of all available messaging channel plugins.
 */
export type { ChannelDock } from "../channels/dock.js";
/**
 * Retrieves metadata for a registered channel by ID.
 * Returns channel capabilities, display name, and other metadata.
 */
export { getChatChannelMeta } from "../channels/registry.js";

/**
 * Configuration types for messaging channels.
 *
 * Key types:
 * - DmPolicy/GroupPolicy: Access control for direct messages and groups
 * - GroupToolPolicyConfig: Control which agent tools are available in groups
 * - MarkdownConfig: Markdown rendering options per channel
 * - GoogleChatConfig/MSTeamsConfig: Channel-specific configuration schemas
 */
export type {
  BlockStreamingCoalesceConfig,
  DmPolicy,
  DmConfig,
  GroupPolicy,
  GroupToolPolicyConfig,
  GroupToolPolicyBySenderConfig,
  MarkdownConfig,
  MarkdownTableMode,
  GoogleChatAccountConfig,
  GoogleChatConfig,
  GoogleChatDmConfig,
  GoogleChatGroupConfig,
  GoogleChatActionConfig,
  MSTeamsChannelConfig,
  MSTeamsConfig,
  MSTeamsReplyStyle,
  MSTeamsTeamConfig,
} from "../config/types.js";
/**
 * Zod validation schemas for core messaging channel configurations.
 * Use these to validate channel configuration objects at runtime.
 */
export {
  DiscordConfigSchema,
  GoogleChatConfigSchema,
  IMessageConfigSchema,
  MSTeamsConfigSchema,
  SignalConfigSchema,
  SlackConfigSchema,
  TelegramConfigSchema,
} from "../config/zod-schema.providers-core.js";

/**
 * Zod validation schema for WhatsApp channel configuration.
 */
export { WhatsAppConfigSchema } from "../config/zod-schema.providers-whatsapp.js";

/**
 * Core configuration validation schemas and utilities.
 *
 * Key schemas:
 * - DmPolicySchema/GroupPolicySchema: Access control validation
 * - MarkdownConfigSchema: Markdown rendering options
 * - normalizeAllowFrom: Normalize allowlist configuration
 */
export {
  BlockStreamingCoalesceSchema,
  DmConfigSchema,
  DmPolicySchema,
  GroupPolicySchema,
  MarkdownConfigSchema,
  MarkdownTableModeSchema,
  normalizeAllowFrom,
  requireOpenAllowFrom,
} from "../config/zod-schema.core.js";

/**
 * Zod validation schema for agent tool policies.
 */
export { ToolPolicySchema } from "../config/zod-schema.agent-runtime.js";

/**
 * RuntimeEnv: Detected runtime environment (Node.js version, platform, etc.)
 */
export type { RuntimeEnv } from "../runtime.js";

/**
 * WizardPrompter: Interactive CLI prompt interface for onboarding wizards.
 */
export type { WizardPrompter } from "../wizard/prompts.js";

/**
 * Account ID utilities.
 * DEFAULT_ACCOUNT_ID: The default account identifier for single-account channels.
 * normalizeAccountId: Normalizes account identifiers to a consistent format.
 */
export { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../routing/session-key.js";

/**
 * ChatType: Enumeration of chat types (dm, group, channel).
 */
export type { ChatType } from "../channels/chat-type.js";

/** @deprecated Use ChatType instead */
export type { RoutePeerKind } from "../routing/resolve-route.js";

/**
 * Resolves the acknowledgment reaction for a given channel.
 * Returns the emoji or symbol used to acknowledge message receipt.
 */
export { resolveAckReaction } from "../agents/identity.js";

/**
 * ReplyPayload: Structure for agent reply messages.
 * Contains text, media, reactions, and metadata for a reply.
 */
export type { ReplyPayload } from "../auto-reply/types.js";

/**
 * ChunkMode: Strategy for splitting long messages into chunks.
 * Options include newline-based, sentence-based, or character-based chunking.
 */
export type { ChunkMode } from "../auto-reply/chunk.js";

/**
 * Silent reply token and detection.
 * SILENT_REPLY_TOKEN: Special token to suppress reply notifications.
 * isSilentReplyText: Checks if text contains the silent reply token.
 */
export { SILENT_REPLY_TOKEN, isSilentReplyText } from "../auto-reply/tokens.js";
/**
 * Device pairing management utilities.
 * Used for managing multi-device authentication flows.
 *
 * - approveDevicePairing: Approve a pending device pairing request
 * - listDevicePairing: List all pending device pairing requests
 * - rejectDevicePairing: Reject a pending device pairing request
 */
export {
  approveDevicePairing,
  listDevicePairing,
  rejectDevicePairing,
} from "../infra/device-pairing.js";

/**
 * Formats error messages for user-friendly display.
 * Strips stack traces and sensitive information.
 */
export { formatErrorMessage } from "../infra/errors.js";

/**
 * WSL (Windows Subsystem for Linux) detection utilities.
 *
 * - isWSLSync: Synchronously detect if running in WSL
 * - isWSL2Sync: Synchronously detect if running in WSL2
 * - isWSLEnv: Check if WSL environment variables are set
 */
export { isWSLSync, isWSL2Sync, isWSLEnv } from "../infra/wsl.js";

/**
 * Parses environment variable values as boolean.
 * Treats "true", "1", "yes" as truthy (case-insensitive).
 */
export { isTruthyEnvValue } from "../infra/env.js";

/**
 * Resolves which agent tools are available for a specific sender in a group.
 * Applies sender-based tool policies from group configuration.
 */
export { resolveToolsBySender } from "../config/group-policy.js";
/**
 * Conversation history management utilities.
 * Used for tracking message context in group chats.
 *
 * - buildPendingHistoryContextFromMap: Build context from history map
 * - clearHistoryEntries: Clear all history entries for a session
 * - recordPendingHistoryEntry: Record a message in conversation history
 * - DEFAULT_GROUP_HISTORY_LIMIT: Default number of messages to retain
 */
export {
  buildPendingHistoryContextFromMap,
  clearHistoryEntries,
  clearHistoryEntriesIfEnabled,
  DEFAULT_GROUP_HISTORY_LIMIT,
  recordPendingHistoryEntry,
  recordPendingHistoryEntryIfEnabled,
} from "../auto-reply/reply/history.js";

/**
 * HistoryEntry: Structure for a conversation history entry.
 * Contains sender, message, timestamp, and metadata.
 */
export type { HistoryEntry } from "../auto-reply/reply/history.js";

/**
 * Allowlist management utilities.
 *
 * - mergeAllowlist: Merge multiple allowlist configurations
 * - summarizeMapping: Create human-readable summary of allowlist mappings
 */
export { mergeAllowlist, summarizeMapping } from "../channels/allowlist-resolve-utils.js";

/**
 * Mention gating utilities for group chats.
 * Controls whether the bot requires explicit mentions to respond.
 *
 * - resolveMentionGating: Check if mention is required for a message
 * - resolveMentionGatingWithBypass: Check mentions with admin bypass
 */
export {
  resolveMentionGating,
  resolveMentionGatingWithBypass,
} from "../channels/mention-gating.js";
/**
 * Acknowledgment reaction configuration types.
 * Used to configure when and how the bot sends "read receipt" reactions.
 *
 * - AckReactionGateParams: Parameters for determining if ack should be sent
 * - AckReactionScope: Scope of ack reactions (dm, group, all)
 * - WhatsAppAckReactionMode: WhatsApp-specific ack reaction behavior
 */
export type {
  AckReactionGateParams,
  AckReactionScope,
  WhatsAppAckReactionMode,
} from "../channels/ack-reactions.js";

/**
 * Acknowledgment reaction utilities.
 *
 * - removeAckReactionAfterReply: Remove ack reaction after sending reply
 * - shouldAckReaction: Determine if ack reaction should be sent
 * - shouldAckReactionForWhatsApp: WhatsApp-specific ack logic
 */
export {
  removeAckReactionAfterReply,
  shouldAckReaction,
  shouldAckReactionForWhatsApp,
} from "../channels/ack-reactions.js";

/**
 * Creates typing indicator callbacks for messaging channels.
 * Returns functions to start/stop typing indicators during processing.
 */
export { createTypingCallbacks } from "../channels/typing.js";

/**
 * Reply prefix utilities.
 * Used to add context or formatting to reply messages.
 *
 * - createReplyPrefixContext: Build context for reply prefix generation
 * - createReplyPrefixOptions: Generate options for reply prefix formatting
 */
export { createReplyPrefixContext, createReplyPrefixOptions } from "../channels/reply-prefix.js";

/**
 * Channel-specific logging utilities.
 *
 * - logAckFailure: Log failures in sending ack reactions
 * - logInboundDrop: Log dropped inbound messages
 * - logTypingFailure: Log failures in typing indicator updates
 */
export { logAckFailure, logInboundDrop, logTypingFailure } from "../channels/logging.js";

/**
 * Resolves the maximum media file size for a given channel.
 * Returns size in bytes based on channel limitations.
 */
export { resolveChannelMediaMaxBytes } from "../channels/plugins/media-limits.js";

/**
 * NormalizedLocation: Structure for location data (latitude, longitude, address).
 */
export type { NormalizedLocation } from "../channels/location.js";

/**
 * Location formatting utilities.
 *
 * - formatLocationText: Format location as human-readable text
 * - toLocationContext: Convert location to agent context
 */
export { formatLocationText, toLocationContext } from "../channels/location.js";

/**
 * Resolves whether control commands are gated for a user.
 * Used to restrict administrative commands to authorized users.
 */
export { resolveControlCommandGate } from "../channels/command-gating.js";
export {
  resolveBlueBubblesGroupRequireMention,
  resolveDiscordGroupRequireMention,
  resolveGoogleChatGroupRequireMention,
  resolveIMessageGroupRequireMention,
  resolveSlackGroupRequireMention,
  resolveTelegramGroupRequireMention,
  resolveWhatsAppGroupRequireMention,
  resolveBlueBubblesGroupToolPolicy,
  resolveDiscordGroupToolPolicy,
  resolveGoogleChatGroupToolPolicy,
  resolveIMessageGroupToolPolicy,
  resolveSlackGroupToolPolicy,
  resolveTelegramGroupToolPolicy,
  resolveWhatsAppGroupToolPolicy,
} from "../channels/plugins/group-mentions.js";
export { recordInboundSession } from "../channels/session.js";
export {
  buildChannelKeyCandidates,
  normalizeChannelSlug,
  resolveChannelEntryMatch,
  resolveChannelEntryMatchWithFallback,
  resolveNestedAllowlistDecision,
} from "../channels/plugins/channel-config.js";
export {
  listDiscordDirectoryGroupsFromConfig,
  listDiscordDirectoryPeersFromConfig,
  listSlackDirectoryGroupsFromConfig,
  listSlackDirectoryPeersFromConfig,
  listTelegramDirectoryGroupsFromConfig,
  listTelegramDirectoryPeersFromConfig,
  listWhatsAppDirectoryGroupsFromConfig,
  listWhatsAppDirectoryPeersFromConfig,
} from "../channels/plugins/directory-config.js";
export type { AllowlistMatch } from "../channels/plugins/allowlist-match.js";
export { formatAllowlistMatchMeta } from "../channels/plugins/allowlist-match.js";
export { optionalStringEnum, stringEnum } from "../agents/schema/typebox.js";
export type { PollInput } from "../polls.js";

export { buildChannelConfigSchema } from "../channels/plugins/config-schema.js";
export {
  deleteAccountFromConfigSection,
  setAccountEnabledInConfigSection,
} from "../channels/plugins/config-helpers.js";
export {
  applyAccountNameToChannelSection,
  migrateBaseNameToDefaultAccount,
} from "../channels/plugins/setup-helpers.js";
export { formatPairingApproveHint } from "../channels/plugins/helpers.js";
export { PAIRING_APPROVED_MESSAGE } from "../channels/plugins/pairing-message.js";

export type {
  ChannelOnboardingAdapter,
  ChannelOnboardingDmPolicy,
} from "../channels/plugins/onboarding-types.js";
export { addWildcardAllowFrom, promptAccountId } from "../channels/plugins/onboarding/helpers.js";
export { promptChannelAccessConfig } from "../channels/plugins/onboarding/channel-access.js";

export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readReactionParams,
  readStringParam,
} from "../agents/tools/common.js";
export { formatDocsLink } from "../terminal/links.js";
export type { HookEntry } from "../hooks/types.js";
export { clamp, escapeRegExp, normalizeE164, safeParseJson, sleep } from "../utils.js";
export { stripAnsi } from "../terminal/ansi.js";
export { missingTargetError } from "../infra/outbound/target-errors.js";
export { registerLogTransport } from "../logging/logger.js";
export type { LogTransport, LogTransportRecord } from "../logging/logger.js";
export {
  emitDiagnosticEvent,
  isDiagnosticsEnabled,
  onDiagnosticEvent,
} from "../infra/diagnostic-events.js";
export type {
  DiagnosticEventPayload,
  DiagnosticHeartbeatEvent,
  DiagnosticLaneDequeueEvent,
  DiagnosticLaneEnqueueEvent,
  DiagnosticMessageProcessedEvent,
  DiagnosticMessageQueuedEvent,
  DiagnosticRunAttemptEvent,
  DiagnosticSessionState,
  DiagnosticSessionStateEvent,
  DiagnosticSessionStuckEvent,
  DiagnosticUsageEvent,
  DiagnosticWebhookErrorEvent,
  DiagnosticWebhookProcessedEvent,
  DiagnosticWebhookReceivedEvent,
} from "../infra/diagnostic-events.js";
export { detectMime, extensionForMime, getFileExtension } from "../media/mime.js";
export { extractOriginalFilename } from "../media/store.js";

// Channel: Discord
export {
  listDiscordAccountIds,
  resolveDefaultDiscordAccountId,
  resolveDiscordAccount,
  type ResolvedDiscordAccount,
} from "../discord/accounts.js";
export { collectDiscordAuditChannelIds } from "../discord/audit.js";
export { discordOnboardingAdapter } from "../channels/plugins/onboarding/discord.js";
export {
  looksLikeDiscordTargetId,
  normalizeDiscordMessagingTarget,
} from "../channels/plugins/normalize/discord.js";
export { collectDiscordStatusIssues } from "../channels/plugins/status-issues/discord.js";

// Channel: iMessage
export {
  listIMessageAccountIds,
  resolveDefaultIMessageAccountId,
  resolveIMessageAccount,
  type ResolvedIMessageAccount,
} from "../imessage/accounts.js";
export { imessageOnboardingAdapter } from "../channels/plugins/onboarding/imessage.js";
export {
  looksLikeIMessageTargetId,
  normalizeIMessageMessagingTarget,
} from "../channels/plugins/normalize/imessage.js";

// Channel: Slack
export {
  listEnabledSlackAccounts,
  listSlackAccountIds,
  resolveDefaultSlackAccountId,
  resolveSlackAccount,
  resolveSlackReplyToMode,
  type ResolvedSlackAccount,
} from "../slack/accounts.js";
export { slackOnboardingAdapter } from "../channels/plugins/onboarding/slack.js";
export {
  looksLikeSlackTargetId,
  normalizeSlackMessagingTarget,
} from "../channels/plugins/normalize/slack.js";
export { buildSlackThreadingToolContext } from "../slack/threading-tool-context.js";

// Channel: Telegram
export {
  listTelegramAccountIds,
  resolveDefaultTelegramAccountId,
  resolveTelegramAccount,
  type ResolvedTelegramAccount,
} from "../telegram/accounts.js";
export { telegramOnboardingAdapter } from "../channels/plugins/onboarding/telegram.js";
export {
  looksLikeTelegramTargetId,
  normalizeTelegramMessagingTarget,
} from "../channels/plugins/normalize/telegram.js";
export { collectTelegramStatusIssues } from "../channels/plugins/status-issues/telegram.js";
export { type TelegramProbe } from "../telegram/probe.js";

// Channel: Signal
export {
  listSignalAccountIds,
  resolveDefaultSignalAccountId,
  resolveSignalAccount,
  type ResolvedSignalAccount,
} from "../signal/accounts.js";
export { signalOnboardingAdapter } from "../channels/plugins/onboarding/signal.js";
export {
  looksLikeSignalTargetId,
  normalizeSignalMessagingTarget,
} from "../channels/plugins/normalize/signal.js";

// Channel: WhatsApp
export {
  listWhatsAppAccountIds,
  resolveDefaultWhatsAppAccountId,
  resolveWhatsAppAccount,
  type ResolvedWhatsAppAccount,
} from "../web/accounts.js";
export { isWhatsAppGroupJid, normalizeWhatsAppTarget } from "../whatsapp/normalize.js";
export { whatsappOnboardingAdapter } from "../channels/plugins/onboarding/whatsapp.js";
export { resolveWhatsAppHeartbeatRecipients } from "../channels/plugins/whatsapp-heartbeat.js";
export {
  looksLikeWhatsAppTargetId,
  normalizeWhatsAppMessagingTarget,
} from "../channels/plugins/normalize/whatsapp.js";
export { collectWhatsAppStatusIssues } from "../channels/plugins/status-issues/whatsapp.js";

// Channel: BlueBubbles
export { collectBlueBubblesStatusIssues } from "../channels/plugins/status-issues/bluebubbles.js";

// Channel: LINE
export {
  listLineAccountIds,
  normalizeAccountId as normalizeLineAccountId,
  resolveDefaultLineAccountId,
  resolveLineAccount,
} from "../line/accounts.js";
export { LineConfigSchema } from "../line/config-schema.js";
export type {
  LineConfig,
  LineAccountConfig,
  ResolvedLineAccount,
  LineChannelData,
} from "../line/types.js";
export {
  createInfoCard,
  createListCard,
  createImageCard,
  createActionCard,
  createReceiptCard,
  type CardAction,
  type ListItem,
} from "../line/flex-templates.js";
export {
  processLineMessage,
  hasMarkdownToConvert,
  stripMarkdown,
} from "../line/markdown-to-line.js";
export type { ProcessedLineMessage } from "../line/markdown-to-line.js";

// Media utilities
export { loadWebMedia, type WebMediaResult } from "../web/media.js";
