import type OpenAI from "openai"

const selectActiveIntent: OpenAI.Chat.ChatCompletionTool = {
	type: "function",
	function: {
		name: "select_active_intent",
		description: "Select an active intent and load its context from .orchestration/active_intents.yaml",
		parameters: {
			type: "object",
			properties: {
				intent_id: {
					type: "string",
					description: "The ID of the intent to activate from .orchestration/active_intents.yaml",
				},
			},
			required: ["intent_id"],
		},
	},
}

export default selectActiveIntent
