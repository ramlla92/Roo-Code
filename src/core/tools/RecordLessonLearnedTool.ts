import * as path from "path"
import * as fs from "fs/promises"
import { Task } from "../task/Task"
import { BaseTool, ToolCallbacks } from "./BaseTool"
import { RecordLessonLearnedParams } from "@roo-code/types"
import { formatResponse } from "../prompts/responses"
import { runPostWriteHooks } from "../../hooks/hookEngine"

export class RecordLessonLearnedTool extends BaseTool<"record_lesson_learned"> {
	readonly name = "record_lesson_learned" as const

	async execute(params: RecordLessonLearnedParams, task: Task, callbacks: ToolCallbacks): Promise<void> {
		const { pushToolResult } = callbacks
		const { source, message, intent_id } = params

		if (!source || !message) {
			const missingParam = !source ? "source" : "message"
			task.consecutiveMistakeCount++
			task.recordToolError("record_lesson_learned")
			const errorMsg = await task.sayAndCreateMissingParamError("record_lesson_learned", missingParam)
			pushToolResult(`Error: ${errorMsg}`)
			return
		}

		try {
			// Find CLAUDE.md or AGENT.md
			const claudeMdPath = path.resolve(task.cwd, "CLAUDE.md")
			const agentMdPath = path.resolve(task.cwd, "AGENT.md")

			let targetPath = claudeMdPath
			// Check if AGENT.md exists first, as it might be preferred if present
			try {
				await fs.access(agentMdPath)
				targetPath = agentMdPath
			} catch {
				// Fall back to CLAUDE.md (will be created if doesn't exist)
			}

			const timestamp = new Date().toISOString()
			const intentStr = intent_id ? ` (Intent: ${intent_id})` : ""
			const entry = `\n- [${timestamp}] [${source}]${intentStr}: ${message}\n`

			let fileExists = false
			try {
				await fs.access(targetPath)
				fileExists = true
			} catch {}

			await fs.appendFile(targetPath, entry, "utf-8")

			// Integrate with hooks for traceability
			const relPath = path.relative(task.cwd, targetPath)
			const content = await fs.readFile(targetPath, "utf-8")

			await runPostWriteHooks({
				intentId: intent_id || task.activeIntentId,
				targetPath: relPath,
				content: content,
				fileExists: fileExists,
				taskId: task.taskId,
				modelIdentifier: task.api.getModel().id,
				cwd: task.cwd,
				mutationClass: "INTENT_EVOLUTION",
			})

			pushToolResult(`Successfully recorded lesson learned in ${path.basename(targetPath)}`)
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error)
			task.recordToolError("record_lesson_learned")
			pushToolResult(`Error recording lesson learned: ${errorMsg}`)
			await task.say("error", `Error recording lesson learned: ${errorMsg}`)
		}
	}
}

export const recordLessonLearnedTool = new RecordLessonLearnedTool()
