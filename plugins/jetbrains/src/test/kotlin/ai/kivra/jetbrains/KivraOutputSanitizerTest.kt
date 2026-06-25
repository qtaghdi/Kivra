package ai.kivra.jetbrains

import org.junit.Assert.assertEquals
import org.junit.Test

class KivraOutputSanitizerTest {
    @Test
    fun stripsOscAnsiAndControlSequences() {
        val raw = "\u001B]1341;command_started;command=706e706d\u0007\u001B[31mhello\u001B[0m\r\nworld\u0000"

        assertEquals("hello\nworld", KivraOutputSanitizer.sanitize(raw))
    }
}
