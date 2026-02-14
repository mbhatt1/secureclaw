import Foundation

public enum SecureClawDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum SecureClawBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum SecureClawThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum SecureClawNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum SecureClawNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct SecureClawBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: SecureClawBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: SecureClawBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct SecureClawThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: SecureClawThermalState

    public init(state: SecureClawThermalState) {
        self.state = state
    }
}

public struct SecureClawStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct SecureClawNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: SecureClawNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [SecureClawNetworkInterfaceType]

    public init(
        status: SecureClawNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [SecureClawNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct SecureClawDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: SecureClawBatteryStatusPayload
    public var thermal: SecureClawThermalStatusPayload
    public var storage: SecureClawStorageStatusPayload
    public var network: SecureClawNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: SecureClawBatteryStatusPayload,
        thermal: SecureClawThermalStatusPayload,
        storage: SecureClawStorageStatusPayload,
        network: SecureClawNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct SecureClawDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
