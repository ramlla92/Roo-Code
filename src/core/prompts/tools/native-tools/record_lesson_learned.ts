import type OpenAI from "openai"

const RECORD_LESSON_LEARNED_DESCRIPTION =
	"Update the project's lessons learned log (CLAUDE.md or AGENT.md) after a verification failure.\n\nUse this tool when a command you ran (like linting or tests) fails, or when a manual verification step reveals a mistake. This ensures the agent learns from its errors and avoids repeating them in the future."

export default {
	type: "function",
	function: {
		name: "record_lesson_learned",
		description: RECORD_LESSON_LEARNED_DESCRIPTION,
		strict: true,
		parameters: {
			type: "object",
			properties: {
				source: {
					type: "string",
					description: "The source of the failure. One of: 'lint', 'tests', 'manual_review'.",
					enum: ["lint", "tests", "manual_review"],
				},
				message: {
					type: "string",
					description: "A clear description of what went wrong and what was learned.",
				},
				intent_id: {
					type: "string",
					description: "The ID of the intent being worked on when the failure occurred.",
				},
			},
			required: ["source", "message"],
			additionalProperties: false,
		},
	},
} satisfies OpenAI.Chat.ChatCompletionTool
