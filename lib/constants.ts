export const CONTEXT_WINDOW = 2;

export const API_ENDPOINTS = {
  ask: "/api/ask",
} as const;

export const JIRA_CONFIG = {
  baseUrl: process.env.JIRA_BASE_URL || "https://your-domain.atlassian.net",
  boardId: process.env.DEFAULT_BOARD_ID
    ? parseInt(process.env.DEFAULT_BOARD_ID, 10)
    : null,
  projectKey: process.env.DEFAULT_PROJECT_KEY || null,
} as const;
