import { ToolDefinition } from "./jira/types";
import type { ChatMessage, OllamaResponse, ToolCall } from "./types";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_OUTPUT_TOKENS = 4096;

/**
 * Chat with tool support using Groq API.
 */
export async function chatWithTools(
  messages: ChatMessage[],
  tools: ToolDefinition[]
): Promise<OllamaResponse> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.tool_calls && {
          tool_calls: msg.tool_calls.map((tc, idx) => ({
            id: `call_${idx}`,
            type: "function",
            function: {
              name: tc.function.name,
              arguments:
                typeof tc.function.arguments === "string"
                  ? tc.function.arguments
                  : JSON.stringify(tc.function.arguments),
            },
          })),
        }),
      })),
      tools: tools.map((tool) => ({
        type: "function",
        function: tool.function,
      })),
      tool_choice: "auto",
      max_tokens: MAX_OUTPUT_TOKENS,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const choice = data.choices[0];

  const toolCalls: ToolCall[] | undefined = choice.message.tool_calls?.map(
    (tc: { function: { name: string; arguments: string } }) => ({
      function: {
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || "{}"),
      },
    })
  );

  return {
    message: {
      role: choice.message.role,
      content: choice.message.content || "",
      tool_calls: toolCalls,
    },
  };
}

/**
 * Stream chat response from Groq API.
 */
export async function* streamChat(
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

export type { ChatMessage, OllamaResponse } from "./types";
