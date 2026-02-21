import fs from "fs/promises"
import crypto from "crypto"
import { fileExistsAtPath } from "./fs"

/**
 * Computes the SHA-256 hash of the given content.
 *
 * @param content - The string content to hash.
 * @returns The SHA-256 hash as a hex string.
 */
export function computeContentHash(content: string): string {
	return crypto.createHash("sha256").update(content, "utf8").digest("hex")
}

/**
 * Computes the SHA-256 hash of a file on disk.
 *
 * @param absPath - The absolute path to the file.
 * @returns The SHA-256 hash as a hex string, or null if the file does not exist.
 */
export async function computeFileHash(absPath: string): Promise<string | null> {
	if (!(await fileExistsAtPath(absPath))) {
		return null
	}
	try {
		const content = await fs.readFile(absPath, "utf8")
		return computeContentHash(content)
	} catch (error) {
		console.error(`Failed to read file for hashing: ${absPath}`, error)
		return null
	}
}
