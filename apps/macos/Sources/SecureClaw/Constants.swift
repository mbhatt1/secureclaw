import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-secureclaw writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.secureclaw.mac"
let gatewayLaunchdLabel = "ai.secureclaw.gateway"
let onboardingVersionKey = "secureclaw.onboardingVersion"
let onboardingSeenKey = "secureclaw.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "secureclaw.pauseEnabled"
let iconAnimationsEnabledKey = "secureclaw.iconAnimationsEnabled"
let swabbleEnabledKey = "secureclaw.swabbleEnabled"
let swabbleTriggersKey = "secureclaw.swabbleTriggers"
let voiceWakeTriggerChimeKey = "secureclaw.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "secureclaw.voiceWakeSendChime"
let showDockIconKey = "secureclaw.showDockIcon"
let defaultVoiceWakeTriggers = ["secureclaw"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "secureclaw.voiceWakeMicID"
let voiceWakeMicNameKey = "secureclaw.voiceWakeMicName"
let voiceWakeLocaleKey = "secureclaw.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "secureclaw.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "secureclaw.voicePushToTalkEnabled"
let talkEnabledKey = "secureclaw.talkEnabled"
let iconOverrideKey = "secureclaw.iconOverride"
let connectionModeKey = "secureclaw.connectionMode"
let remoteTargetKey = "secureclaw.remoteTarget"
let remoteIdentityKey = "secureclaw.remoteIdentity"
let remoteProjectRootKey = "secureclaw.remoteProjectRoot"
let remoteCliPathKey = "secureclaw.remoteCliPath"
let canvasEnabledKey = "secureclaw.canvasEnabled"
let cameraEnabledKey = "secureclaw.cameraEnabled"
let systemRunPolicyKey = "secureclaw.systemRunPolicy"
let systemRunAllowlistKey = "secureclaw.systemRunAllowlist"
let systemRunEnabledKey = "secureclaw.systemRunEnabled"
let locationModeKey = "secureclaw.locationMode"
let locationPreciseKey = "secureclaw.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "secureclaw.peekabooBridgeEnabled"
let deepLinkKeyKey = "secureclaw.deepLinkKey"
let modelCatalogPathKey = "secureclaw.modelCatalogPath"
let modelCatalogReloadKey = "secureclaw.modelCatalogReload"
let cliInstallPromptedVersionKey = "secureclaw.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "secureclaw.heartbeatsEnabled"
let debugPaneEnabledKey = "secureclaw.debugPaneEnabled"
let debugFileLogEnabledKey = "secureclaw.debug.fileLogEnabled"
let appLogLevelKey = "secureclaw.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
