package ai.kivra.jetbrains

import com.google.gson.Gson
import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.isDirectory

object KivraProjectMatcher {
    private val gson = Gson()

    fun findRegisteredProject(projectBasePath: String?, projectsFile: Path = KivraPaths.projectsFile()): Path? {
        if (projectBasePath.isNullOrBlank() || !Files.exists(projectsFile)) {
            return null
        }

        val currentPath = canonicalPath(Path.of(projectBasePath))
        val registeredProjects = runCatching {
            gson.fromJson(Files.readString(projectsFile), Array<String>::class.java).orEmpty()
        }.getOrDefault(emptyArray())

        return registeredProjects
            .asSequence()
            .filter { it.isNotBlank() }
            .map { canonicalPath(Path.of(it)) }
            .filter { it.isDirectory() }
            .firstOrNull { currentPath.startsWith(it) }
    }

    private fun canonicalPath(path: Path): Path = runCatching {
        path.toRealPath()
    }.getOrElse {
        path.toAbsolutePath().normalize()
    }
}
