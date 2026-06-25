package ai.kivra.jetbrains

import com.google.gson.Gson
import java.io.BufferedWriter
import java.nio.file.Files
import java.nio.file.Path
import java.time.Instant
import java.util.UUID
import kotlin.io.path.createDirectories

private const val CAPTURE_PROTOCOL_VERSION = 1
private const val CAPTURE_START_FILE = "start.json"
private const val CAPTURE_EVENTS_FILE = "events.jsonl"
private const val CAPTURE_END_FILE = "end.json"
private const val CAPTURE_INDEX_FILE = "index.jsonl"

class KivraCapturedRunWriter private constructor(
    private val runDirectory: Path,
    private val eventsWriter: BufferedWriter,
    private val startedAtMillis: Long
) : AutoCloseable {
    private var closed = false

    fun append(stream: String, rawData: String) {
        val data = KivraOutputSanitizer.sanitize(rawData)

        if (data.isEmpty()) {
            return
        }

        synchronized(eventsWriter) {
            eventsWriter.write(gson.toJson(CapturedRunEvent(stream = stream, data = data)))
            eventsWriter.newLine()
            eventsWriter.flush()
        }
    }

    fun finish(exitCode: Int?) {
        if (closed) {
            return
        }

        closed = true
        eventsWriter.close()
        val finishedAtMillis = System.currentTimeMillis()
        Files.writeString(
            runDirectory.resolve(CAPTURE_END_FILE),
            gson.toJson(
                CapturedRunEnd(
                    finishedAt = Instant.ofEpochMilli(finishedAtMillis).toString(),
                    exitCode = exitCode,
                    durationMs = finishedAtMillis - startedAtMillis
                )
            ) + "\n"
        )
    }

    override fun close() {
        finish(null)
    }

    companion object {
        private val gson = Gson()

        fun start(projectPath: Path, command: String): KivraCapturedRunWriter {
            val id = "${System.currentTimeMillis()}-${UUID.randomUUID()}"
            val runDirectory = KivraPaths
                .capturedRunsRoot()
                .resolve(KivraPaths.projectKey(projectPath))
                .resolve(id)
            val startedAtMillis = System.currentTimeMillis()
            val startedAt = Instant.ofEpochMilli(startedAtMillis).toString()

            runDirectory.createDirectories()
            Files.writeString(
                runDirectory.resolve(CAPTURE_START_FILE),
                gson.toJson(
                    CapturedRunStart(
                        id = id,
                        projectPath = projectPath.toString(),
                        command = command,
                        startedAt = startedAt
                    )
                ) + "\n"
            )
            Files.writeString(
                runDirectory.parent.resolve(CAPTURE_INDEX_FILE),
                gson.toJson(
                    CapturedRunIndex(
                        id = id,
                        projectPath = projectPath.toString(),
                        command = command,
                        startedAt = startedAt
                    )
                ) + "\n",
                java.nio.file.StandardOpenOption.CREATE,
                java.nio.file.StandardOpenOption.APPEND
            )

            return KivraCapturedRunWriter(
                runDirectory = runDirectory,
                eventsWriter = Files.newBufferedWriter(
                    runDirectory.resolve(CAPTURE_EVENTS_FILE),
                    java.nio.file.StandardOpenOption.CREATE,
                    java.nio.file.StandardOpenOption.APPEND
                ),
                startedAtMillis = startedAtMillis
            )
        }
    }
}

private data class CapturedRunStart(
    val type: String = "start",
    val protocolVersion: Int = CAPTURE_PROTOCOL_VERSION,
    val id: String,
    val projectPath: String,
    val command: String,
    val startedAt: String,
    val captureMode: String = "jetbrains"
)

private data class CapturedRunIndex(
    val protocolVersion: Int = CAPTURE_PROTOCOL_VERSION,
    val id: String,
    val projectPath: String,
    val command: String,
    val startedAt: String,
    val captureMode: String = "jetbrains"
)

private data class CapturedRunEvent(
    val type: String = "output",
    val protocolVersion: Int = CAPTURE_PROTOCOL_VERSION,
    val time: String = Instant.now().toString(),
    val pid: Int? = null,
    val ppid: Int? = null,
    val execname: String? = null,
    val stream: String,
    val data: String
)

private data class CapturedRunEnd(
    val type: String = "end",
    val protocolVersion: Int = CAPTURE_PROTOCOL_VERSION,
    val finishedAt: String,
    val exitCode: Int?,
    val durationMs: Long
)
