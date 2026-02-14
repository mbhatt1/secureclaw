import Foundation

public enum SecureClawCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum SecureClawCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum SecureClawCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum SecureClawCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct SecureClawCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: SecureClawCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: SecureClawCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: SecureClawCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: SecureClawCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct SecureClawCameraClipParams: Codable, Sendable, Equatable {
    public var facing: SecureClawCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: SecureClawCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: SecureClawCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: SecureClawCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
