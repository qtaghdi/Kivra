package ai.kivra.jetbrains

import com.intellij.execution.ExecutionManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.StartupActivity

class KivraStartupActivity : StartupActivity.DumbAware {
    override fun runActivity(project: Project) {
        project.messageBus
            .connect(project)
            .subscribe(ExecutionManager.EXECUTION_TOPIC, KivraExecutionListener(project))
    }
}
