import * as vscode from "vscode"
import { postWriteHook } from "./postWriteHook"
import { checkScopeEnforcement } from "./scopeChecker"

export type HookContext = {
	intentId?: string
	toolName?: string
	targetPath?: string
	content?: string
	fileExists?: boolean
	taskId?: string
	modelIdentifier?: string
	cwd?: string
	mutationClass?: string
}

export type HookResponse = {
	allowed: boolean
	type?: "tool_blocked" | "rejected_by_user"
	reason?: "scope_violation" | "user_rejection"
	message?: string
}

const DESTRUCTIVE_TOOLS = [
	"write_to_file",
	"apply_diff",
	"edit",
	"search_and_replace",
	"search_replace",
	"edit_file",
	"apply_patch",
	"execute_command",
]

export async function runPreToolHooks(ctx: HookContext): Promise<HookResponse> {
	const isDestructive = ctx.toolName && DESTRUCTIVE_TOOLS.includes(ctx.toolName)

	if (!isDestructive) {
		return { allowed: true }
	}

	// 1. Scope Enforcement (if applicable)
	if (ctx.toolName === "write_to_file" && ctx.cwd && ctx.intentId && ctx.targetPath) {
		const scopeCheck = await checkScopeEnforcement(ctx.cwd, ctx.intentId, ctx.targetPath)
		if (!scopeCheck.allowed) {
			return {
				allowed: false,
				type: "tool_blocked",
				reason: "scope_violation",
				message: scopeCheck.message,
			}
		}
	}

	// 2. UI-blocking authorization
	const approve = "Approve"
	const reject = "Reject"
	const selection = await vscode.window.showWarningMessage(
		`AI is requesting to run a destructive tool: ${ctx.toolName}${ctx.targetPath ? ` on ${ctx.targetPath}` : ""}. Do you want to proceed?`,
		{ modal: true },
		approve,
		reject,
	)

	if (selection !== approve) {
		return {
			allowed: false,
			type: "rejected_by_user",
			reason: "user_rejection",
			message: `Tool ${ctx.toolName} was rejected by the user.`,
		}
	}

	return { allowed: true }
}

export async function runPreLlmHooks(ctx: HookContext) {
	// For this challenge, most context injection happens in PreToolUse.
	return
}

export async function runPostWriteHooks(ctx: HookContext) {
	await postWriteHook(ctx)
}
