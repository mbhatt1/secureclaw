import SecureClawKit
import SecureClawProtocol
import Foundation

// Prefer the SecureClawKit wrapper to keep gateway request payloads consistent.
typealias AnyCodable = SecureClawKit.AnyCodable
typealias InstanceIdentity = SecureClawKit.InstanceIdentity

extension AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: AnyCodable]? { self.value as? [String: AnyCodable] }
    var arrayValue: [AnyCodable]? { self.value as? [AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}

extension SecureClawProtocol.AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: SecureClawProtocol.AnyCodable]? { self.value as? [String: SecureClawProtocol.AnyCodable] }
    var arrayValue: [SecureClawProtocol.AnyCodable]? { self.value as? [SecureClawProtocol.AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: SecureClawProtocol.AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [SecureClawProtocol.AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}
