export interface AskRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  stream?: boolean;
}

export interface StreamEvent {
  type: "reasoning" | "tool_call" | "tool_result" | "chunk" | "error" | "done" | "structured_data";
  content?: string;
  tool?: string;
  arguments?: Record<string, unknown>;
  data?: unknown;
}

export interface ToolResponse {
  tool: string;
  arguments: Record<string, unknown>;
  result: unknown;
  error?: string;
}

export interface ExecuteRequest {
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallInput {
  name: string;
  arguments: Record<string, unknown>;
}

