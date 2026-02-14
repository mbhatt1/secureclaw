// swift-tools-version: 6.2
// Package manifest for the SecureClaw macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "SecureClaw",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "SecureClawIPC", targets: ["SecureClawIPC"]),
        .library(name: "SecureClawDiscovery", targets: ["SecureClawDiscovery"]),
        .executable(name: "SecureClaw", targets: ["SecureClaw"]),
        .executable(name: "secureclaw-mac", targets: ["SecureClawMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/SecureClawKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "SecureClawIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "SecureClawDiscovery",
            dependencies: [
                .product(name: "SecureClawKit", package: "SecureClawKit"),
            ],
            path: "Sources/SecureClawDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "SecureClaw",
            dependencies: [
                "SecureClawIPC",
                "SecureClawDiscovery",
                .product(name: "SecureClawKit", package: "SecureClawKit"),
                .product(name: "SecureClawChatUI", package: "SecureClawKit"),
                .product(name: "SecureClawProtocol", package: "SecureClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/SecureClaw.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "SecureClawMacCLI",
            dependencies: [
                "SecureClawDiscovery",
                .product(name: "SecureClawKit", package: "SecureClawKit"),
                .product(name: "SecureClawProtocol", package: "SecureClawKit"),
            ],
            path: "Sources/SecureClawMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "SecureClawIPCTests",
            dependencies: [
                "SecureClawIPC",
                "SecureClaw",
                "SecureClawDiscovery",
                .product(name: "SecureClawProtocol", package: "SecureClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
