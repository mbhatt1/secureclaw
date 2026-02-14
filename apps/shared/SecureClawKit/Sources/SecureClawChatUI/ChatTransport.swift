import Foundation

public enum SecureClawChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(SecureClawChatEventPayload)
    case agent(SecureClawAgentEventPayload)
    case seqGap
}

public protocol SecureClawChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> SecureClawChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [SecureClawChatAttachmentPayload]) async throws -> SecureClawChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> SecureClawChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<SecureClawChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension SecureClawChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "SecureClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> SecureClawChatSessionsListResponse {
        throw NSError(
            domain: "SecureClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}
