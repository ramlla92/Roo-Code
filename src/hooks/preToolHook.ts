#!/usr/bin/env node
import fs from "fs"
import path from "path"
import * as yaml from "js-yaml"

type HookInput = {
	hookName: "PreToolUse"
	taskId: string
	tool: {
		name: string
		params: Record<string, unknown>
	}
	workspaceRoots: string[]
}

type HookOutput = {
	cancel?: boolean
	cancelReason?: string
	contextModification?: {
		additionalContext?: string
	}
}

function loadActiveIntents(workspaceRoot: string) {
	const filePath = path.join(workspaceRoot, ".orchestration", "active_intents.yaml")
	if (!fs.existsSync(filePath)) return null
	const raw = fs.readFileSync(filePath, "utf8")
	return yaml.load(raw) as {
		active_intents?: {
			id: string
			name?: string
			status?: string
			owned_scope?: string[]
			constraints?: string[]
		}[]
	}
}

function findIntent(model: ReturnType<typeof loadActiveIntents>, id: string) {
	const list = model?.active_intents ?? []
	return list.find((i) => i.id === id)
}

async function main() {
	const stdin = await new Promise<string>((resolve) => {
		let data = ""
		process.stdin.setEncoding("utf8")
		process.stdin.on("data", (chunk) => (data += chunk))
		process.stdin.on("end", () => resolve(data))
	})

	const input = JSON.parse(stdin) as HookInput
	const workspaceRoot = input.workspaceRoots[0] ?? process.cwd()

	// Default: allow tool to proceed
	const output: HookOutput = {}

	if (input.tool.name === "select_active_intent") {
		const params = input.tool.params ?? {}
		const intentId = typeof params.intent_id === "string" ? params.intent_id.trim() : ""

		const model = loadActiveIntents(workspaceRoot)
		const intent = intentId && model ? findIntent(model, intentId) : undefined

		if (!intent) {
			output.cancel = true
			output.cancelReason = "You must cite a valid active Intent ID."
		} else {
			// Build richer context to inject on the NEXT prompt
			const lines = ["<intent_context>", `  <id>${intent.id}</id>`]

			if (intent.owned_scope?.length) {
				lines.push("  <owned_scope>")
				for (const p of intent.owned_scope) {
					lines.push(`    <path>${p}</path>`)
				}
				lines.push("  </owned_scope>")
			}

			if (intent.constraints?.length) {
				lines.push("  <constraints>")
				for (const c of intent.constraints) {
					lines.push(`    <rule>${c}</rule>`)
				}
				lines.push("  </constraints>")
			}

			lines.push("</intent_context>")

			output.contextModification = {
				additionalContext: lines.join("\n"),
			}
		}
	} else {
		// Gatekeeper: for now, we only block if we want to enforce "must have active intent"
		// In a later step, you can read some shared state to see if an intent is set.
	}

	process.stdout.write(JSON.stringify(output))
}

main().catch((err) => {
	// On hook failure, don't block everything; just no-op
	process.stdout.write(JSON.stringify({}))
})
