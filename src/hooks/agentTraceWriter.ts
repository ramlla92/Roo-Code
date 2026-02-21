import path from "path"
import fs from "fs/promises"

export async function writeTraceEntry(cwd: string, entry: any) {
	const orchestrationDir = path.join(cwd, ".orchestration")
	await fs.mkdir(orchestrationDir, { recursive: true })

	const tracePath = path.join(orchestrationDir, "agenttrace.jsonl")
	await fs.appendFile(tracePath, JSON.stringify(entry) + "\n", "utf8")
}
