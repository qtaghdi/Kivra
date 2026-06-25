package ai.kivra.jetbrains

object KivraOutputSanitizer {
    fun sanitize(value: String): String {
        val output = StringBuilder(value.length)
        var index = 0

        while (index < value.length) {
            val character = value[index]

            if (character == '\u001B') {
                val next = value.getOrNull(index + 1)
                index = when (next) {
                    ']' -> skipOsc(value, index + 2)
                    '[' -> skipCsi(value, index + 2)
                    else -> index + 1
                }
                continue
            }

            if (character == ']' && value.startsWith("]1341;", index)) {
                index = skipBel(value, index + 6)
                continue
            }

            if (character == '\n' || character == '\t' || (!character.isISOControl() && character != '\u007F')) {
                output.append(character)
            }

            index += 1
        }

        return output.toString().replace("\r\n", "\n").replace('\r', '\n')
    }

    private fun skipOsc(value: String, startIndex: Int): Int {
        var index = startIndex

        while (index < value.length) {
            if (value[index] == '\u0007') {
                return index + 1
            }

            if (value[index] == '\u001B' && value.getOrNull(index + 1) == '\\') {
                return index + 2
            }

            index += 1
        }

        return index
    }

    private fun skipCsi(value: String, startIndex: Int): Int {
        var index = startIndex

        while (index < value.length) {
            if (value[index] in '@'..'~') {
                return index + 1
            }

            index += 1
        }

        return index
    }

    private fun skipBel(value: String, startIndex: Int): Int {
        var index = startIndex

        while (index < value.length) {
            if (value[index] == '\u0007') {
                return index + 1
            }

            index += 1
        }

        return index
    }
}
