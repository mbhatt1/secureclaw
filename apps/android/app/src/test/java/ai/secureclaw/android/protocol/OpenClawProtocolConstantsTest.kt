package ai.secureclaw.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class SecureClawProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", SecureClawCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", SecureClawCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", SecureClawCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", SecureClawCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", SecureClawCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", SecureClawCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", SecureClawCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", SecureClawCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", SecureClawCapability.Canvas.rawValue)
    assertEquals("camera", SecureClawCapability.Camera.rawValue)
    assertEquals("screen", SecureClawCapability.Screen.rawValue)
    assertEquals("voiceWake", SecureClawCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", SecureClawScreenCommand.Record.rawValue)
  }
}
