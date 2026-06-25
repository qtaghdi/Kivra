package ai.kivra.jetbrains

import java.nio.file.Path
import java.security.MessageDigest

private const val KIVRA_HOME_DIRECTORY = ".kivra"
private const val CAPTURED_RUNS_DIRECTORY = "captured-runs"

object KivraPaths {
    fun home(): Path = Path.of(System.getProperty("user.home")).resolve(KIVRA_HOME_DIRECTORY)

    fun projectsFile(): Path = home().resolve("trace-projects.json")

    fun capturedRunsRoot(): Path = home().resolve(CAPTURED_RUNS_DIRECTORY)

    fun projectKey(projectPath: Path): String {
        val name = projectPath.fileName?.toString()?.takeIf { it.isNotBlank() } ?: "project"
        val digest = MessageDigest
            .getInstance("SHA-1")
            .digest(projectPath.toString().toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
            .take(12)

        return "$name-$digest"
    }
}
