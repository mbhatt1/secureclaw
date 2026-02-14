// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "SecureClawKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "SecureClawProtocol", targets: ["SecureClawProtocol"]),
        .library(name: "SecureClawKit", targets: ["SecureClawKit"]),
        .library(name: "SecureClawChatUI", targets: ["SecureClawChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "SecureClawProtocol",
            path: "Sources/SecureClawProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "SecureClawKit",
            dependencies: [
                "SecureClawProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/SecureClawKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "SecureClawChatUI",
            dependencies: [
                "SecureClawKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/SecureClawChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "SecureClawKitTests",
            dependencies: ["SecureClawKit", "SecureClawChatUI"],
            path: "Tests/SecureClawKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
