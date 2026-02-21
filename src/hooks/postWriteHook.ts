// src/hooks/postWriteHook.ts
import crypto from "crypto"
import { HookContext } from "./hookEngine"
import { writeTraceEntry } from "./agentTraceWriter"

export async function postWriteHook(ctx: HookContext) {
	const { intentId, targetPath, content, fileExists, taskId, modelIdentifier, cwd } = ctx

	if (!intentId || !targetPath || !content || !cwd) {
		// No intent or insufficient data → do nothing for now
		return
	}

	const hash = crypto.createHash("sha256").update(content, "utf8").digest("hex")

	const entry = {
		id: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		intentId,
		path: targetPath,
		fileExists,
		contentHash: hash,
		taskId,
		modelIdentifier,
		mutationClass: "AST_REFACTOR", // Placeholder as requested
	}

	await writeTraceEntry(cwd, entry)
}
