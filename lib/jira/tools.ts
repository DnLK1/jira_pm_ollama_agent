import { ToolDefinition } from "./types";

export const TOOL_NAMES = [
  "prepare_search",
  "get_sprint_issues",
  "get_issue",
  "create_issue",
] as const;

export const jiraTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "prepare_search",
      description: `Resolve names to emails.

Examples:
- prepare_search() - get all team members for active sprint
- prepare_search(names: ["John"]) - resolve John's email
- prepare_search(sprint_ids: [9887]) - get all team for specific sprint

Returns: { people: [{name, resolved_email}], sprints: [{id, name}] }`,
      parameters: {
        type: "object",
        properties: {
          names: {
            type: "array",
            description: "Names to resolve (omit or empty = all team members)",
          },
          sprint_ids: {
            type: "array",
            description: "Sprint IDs (defaults to active sprint if omitted)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sprint_issues",
      description: `Get issues from sprints with filtering.

Examples:
- get_sprint_issues(sprint_ids: [9887]) - all issues
- get_sprint_issues(sprint_ids: [9887], status_filters: ["Concluído"]) - done tasks
- get_sprint_issues(sprint_ids: [9887], status_filters: ["UI Review"]) - in UI review
- get_sprint_issues(sprint_ids: [9887], include_breakdown: true) - with breakdown chart

Returns: { total_issues, sprints: { "Sprint Name": { issues: [...] } } }`,
      parameters: {
        type: "object",
        properties: {
          sprint_ids: {
            type: "array",
            description: "Sprint IDs from AVAILABLE SPRINTS in prompt",
          },
          assignees: {
            type: "array",
            description: "Filter by assignee name(s) or email(s)",
          },
          status_filters: {
            type: "array",
            description:
              "Filter by exact status names from AVAILABLE STATUSES (e.g. 'Concluído', 'UI Review', 'In QA')",
          },
          keyword: {
            type: "string",
            description: "Filter by keyword in summary",
          },
          include_breakdown: {
            type: "boolean",
            description:
              "Show assignee breakdown chart (for productivity questions)",
          },
        },
        required: ["sprint_ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_issue",
      description: `Get details of a specific issue by key, including comments.

Examples:
- get_issue(issue_key: "ODPP-1097") - get full details and comments

Returns: { key, summary, description, status, assignee, comments: [...] }`,
      parameters: {
        type: "object",
        properties: {
          issue_key: {
            type: "string",
            description: "The issue key (e.g. ODPP-1097)",
          },
        },
        required: ["issue_key"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_issue",
      description: `Create a new issue in Jira. ONLY call this AFTER user confirms.

Examples:
- create_issue(summary: "Add cart badge feature") - basic story
- create_issue(summary: "Login broken", issue_type: "Bug", assignee: "Daniel") - bug with assignee
- create_issue(summary: "User authentication", sprint_id: 9887, story_points: 5) - story with sprint and points

Returns: { key, url, summary, issue_type, assignee, sprint, story_points, status }`,
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "The issue title/summary (required)",
          },
          description: {
            type: "string",
            description: "Detailed description of the issue",
          },
          issue_type: {
            type: "string",
            description: "Issue type: Story (default) or Bug",
          },
          assignee: {
            type: "string",
            description: "Name of the assignee from TEAM MEMBERS list",
          },
          sprint_id: {
            type: "number",
            description:
              "Sprint ID to add the issue to (from AVAILABLE SPRINTS)",
          },
          story_points: {
            type: "number",
            description: "Story point estimate",
          },
          status: {
            type: "string",
            description:
              "Target status from AVAILABLE STATUSES (e.g. 'UI Review', 'Concluído'). If omitted, stays in initial status.",
          },
        },
        required: ["summary"],
      },
    },
  },
];
