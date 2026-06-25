package ai.kivra.jetbrains

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.nio.file.Files

class KivraProjectMatcherTest {
    @Test
    fun matchesNestedProjectPath() {
        val root = Files.createTempDirectory("kivra-project")
        val child = Files.createDirectories(root.resolve("apps/web"))
        val projectsFile = Files.createTempFile("kivra-projects", ".json")
        Files.writeString(projectsFile, "[${quote(root.toString())}]")

        assertEquals(root.toRealPath(), KivraProjectMatcher.findRegisteredProject(child.toString(), projectsFile))
    }

    @Test
    fun ignoresUnregisteredProjectPath() {
        val registered = Files.createTempDirectory("kivra-registered")
        val other = Files.createTempDirectory("kivra-other")
        val projectsFile = Files.createTempFile("kivra-projects", ".json")
        Files.writeString(projectsFile, "[${quote(registered.toString())}]")

        assertNull(KivraProjectMatcher.findRegisteredProject(other.toString(), projectsFile))
    }

    private fun quote(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""
}
