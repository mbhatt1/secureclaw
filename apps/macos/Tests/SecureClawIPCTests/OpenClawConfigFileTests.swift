import Foundation
import Testing
@testable import SecureClaw

@Suite(.serialized)
struct SecureClawConfigFileTests {
    @Test
    func configPathRespectsEnvOverride() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("secureclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("secureclaw.json")
            .path

        await TestIsolation.withEnvValues(["SECURECLAW_CONFIG_PATH": override]) {
            #expect(SecureClawConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func remoteGatewayPortParsesAndMatchesHost() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("secureclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("secureclaw.json")
            .path

        await TestIsolation.withEnvValues(["SECURECLAW_CONFIG_PATH": override]) {
            SecureClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(SecureClawConfigFile.remoteGatewayPort() == 19999)
            #expect(SecureClawConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(SecureClawConfigFile.remoteGatewayPort(matchingHost: "gateway") == 19999)
            #expect(SecureClawConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
        }
    }

    @MainActor
    @Test
    func setRemoteGatewayUrlPreservesScheme() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("secureclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("secureclaw.json")
            .path

        await TestIsolation.withEnvValues(["SECURECLAW_CONFIG_PATH": override]) {
            SecureClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            SecureClawConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = SecureClawConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @Test
    func stateDirOverrideSetsConfigPath() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("secureclaw-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "SECURECLAW_CONFIG_PATH": nil,
            "SECURECLAW_STATE_DIR": dir,
        ]) {
            #expect(SecureClawConfigFile.stateDirURL().path == dir)
            #expect(SecureClawConfigFile.url().path == "\(dir)/secureclaw.json")
        }
    }
}
