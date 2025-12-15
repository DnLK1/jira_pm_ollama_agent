export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

export interface OllamaResponse {
  message: {
    role: string;
    content: string;
    tool_calls?: ToolCall[];
  };
}

