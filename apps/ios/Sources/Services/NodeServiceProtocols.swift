import CoreLocation
import Foundation
import SecureClawKit
import UIKit

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: SecureClawCameraSnapParams) async throws -> (format: String, base64: String, width: Int, height: Int)
    func clip(params: SecureClawCameraClipParams) async throws -> (format: String, base64: String, durationMs: Int, hasAudio: Bool)
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: SecureClawLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: SecureClawLocationGetParams,
        desiredAccuracy: SecureClawLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
}

protocol DeviceStatusServicing: Sendable {
    func status() async throws -> SecureClawDeviceStatusPayload
    func info() -> SecureClawDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: SecureClawPhotosLatestParams) async throws -> SecureClawPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: SecureClawContactsSearchParams) async throws -> SecureClawContactsSearchPayload
    func add(params: SecureClawContactsAddParams) async throws -> SecureClawContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: SecureClawCalendarEventsParams) async throws -> SecureClawCalendarEventsPayload
    func add(params: SecureClawCalendarAddParams) async throws -> SecureClawCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: SecureClawRemindersListParams) async throws -> SecureClawRemindersListPayload
    func add(params: SecureClawRemindersAddParams) async throws -> SecureClawRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: SecureClawMotionActivityParams) async throws -> SecureClawMotionActivityPayload
    func pedometer(params: SecureClawPedometerParams) async throws -> SecureClawPedometerPayload
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
