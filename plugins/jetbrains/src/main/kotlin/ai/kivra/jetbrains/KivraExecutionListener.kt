package ai.kivra.jetbrains

import com.intellij.execution.ExecutionListener
import com.intellij.execution.configurations.RunProfile
import com.intellij.execution.process.OSProcessHandler
import com.intellij.execution.process.ProcessEvent
import com.intellij.execution.process.ProcessHandler
import com.intellij.execution.process.ProcessListener
import com.intellij.execution.process.ProcessOutputTypes
import com.intellij.execution.runners.ExecutionEnvironment
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Key

class KivraExecutionListener(private val project: Project) : ExecutionListener {
    override fun processStarted(executorId: String, env: ExecutionEnvironment, handler: ProcessHandler) {
        val registeredProject = KivraProjectMatcher.findRegisteredProject(project.basePath) ?: return
        val command = commandLabel(env.runProfile, executorId, handler)
        val writer = runCatching {
            KivraCapturedRunWriter.start(registeredProject, command)
        }.getOrNull() ?: return

        handler.addProcessListener(object : ProcessListener {
            override fun onTextAvailable(event: ProcessEvent, outputType: Key<*>) {
                when (outputType) {
                    ProcessOutputTypes.STDOUT -> writer.append("stdout", event.text)
                    ProcessOutputTypes.STDERR -> writer.append("stderr", event.text)
                }
            }

            override fun processTerminated(event: ProcessEvent) {
                writer.finish(event.exitCode)
            }
        })
    }

    private fun commandLabel(runProfile: RunProfile, executorId: String, handler: ProcessHandler): String {
        val commandLine = (handler as? OSProcessHandler)?.commandLine?.takeIf { it.isNotBlank() }

        return commandLine ?: "${runProfile.name} ($executorId)"
    }
}
