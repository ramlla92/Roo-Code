import path from "path"
import fs from "fs/promises"
import yaml from "js-yaml"
import ignore from "ignore"
import { fileExistsAtPath } from "../utils/fs"

export interface IntentContext {
	id: string
	name: string
	owned_scope?: string[]
}

export async function getActiveIntent(cwd: string, intentId: string): Promise<IntentContext | undefined> {
	try {
		const filePath = path.join(cwd, ".orchestration", "active_intents.yaml")
		if (await fileExistsAtPath(filePath)) {
			const fileContent = await fs.readFile(filePath, "utf8")
			const data = yaml.load(fileContent) as any
			return data?.active_intents?.find((i: any) => i.id === intentId)
		}
	} catch (error) {
		console.error("Error reading active_intents.yaml:", error)
	}
	return undefined
}

export async function isPathIgnored(cwd: string, intentId: string, targetPath: string): Promise<boolean> {
	const ignoreFiles = [path.join(cwd, ".orchestration", ".intentignore"), path.join(cwd, ".intentignore")]

	for (const ignoreFile of ignoreFiles) {
		if (await fileExistsAtPath(ignoreFile)) {
			try {
				const content = await fs.readFile(ignoreFile, "utf8")
				const ig = ignore().add(content)
				if (ig.ignores(targetPath)) {
					return true
				}
			} catch (error) {
				console.error(`Error processing ignore file ${ignoreFile}:`, error)
			}
		}
	}
	return false
}

export async function checkScopeEnforcement(
	cwd: string,
	intentId: string,
	targetPath: string,
): Promise<{ allowed: boolean; message?: string }> {
	// 1. Check .intentignore
	if (await isPathIgnored(cwd, intentId, targetPath)) {
		return {
			allowed: false,
			message: `Scope Violation: ${intentId} is not authorized to edit ${targetPath}. File is ignored by .intentignore.`,
		}
	}

	// 2. Check owned_scope
	const intent = await getActiveIntent(cwd, intentId)
	if (!intent) {
		return { allowed: true } // If no intent def found, fallback to proceed (audit only)
	}

	const scope = intent.owned_scope || []
	if (scope.length === 0) {
		return { allowed: true }
	}

	const normalizedTarget = path.normalize(targetPath).replace(/\\/g, "/")

	const isAllowed = scope.some((pattern) => {
		const normalizedPattern = path.normalize(pattern).replace(/\\/g, "/")
		// Simple prefix match for now, could be improved with glob matching if needed
		return normalizedTarget.startsWith(normalizedPattern)
	})

	if (!isAllowed) {
		return {
			allowed: false,
			message: `Scope Violation: ${intentId} is not authorized to edit ${targetPath}. Request scope expansion.`,
		}
	}

	return { allowed: true }
}
