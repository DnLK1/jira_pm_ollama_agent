export interface JiraIssue {
  key: string;
  summary: string;
  description: string | null;
  status: string;
  priority: string | null;
  issue_type: string;
  assignee: string | null;
  reporter: string;
  created: string;
  updated: string;
  labels: string[];
  sprint: string | null;
  story_points: number | null;
}

export interface JiraBoardInfo {
  id: number;
  name: string;
  type: string;
  project_key: string;
  project_name: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: string;
  start_date: string | null;
  end_date: string | null;
  goal: string | null;
}

export interface JiraSprintIssues {
  sprint_name: string;
  total_issues: number;
  status_breakdown: {
    todo: number;
    in_progress: number;
    done: number;
  };
  issues: Array<{
    key: string;
    summary: string;
    status: string;
    issue_type: string;
    assignee: string | null;
    assignee_display_name: string | null;
    story_points: number | null;
  }>;
}

export interface TeamMember {
  name: string;
  email: string;
}

export interface JiraSprintSummary {
  sprint: JiraSprint | null;
  total_issues: number;
  status_breakdown: {
    todo: number;
    in_progress: number;
    done: number;
  };
  team_members: string[];
  issues: JiraSprintIssues["issues"];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<
        string,
        {
          type: string;
          items?: { type: string };
          description: string;
        }
      >;
      required: string[];
    };
  };
}

export type ToolName = "prepare_search" | "get_sprint_issues" | "get_issue";

export type ToolResultMap = {
  prepare_search: {
    all_team: boolean;
    team_members?: string[];
    people?: Array<{
      name: string;
      resolved_email: string | null;
      possible_matches: string[];
      not_found: boolean;
    }>;
    board: { name: string; project_name: string };
    sprints: Array<{ id: number; name: string; state: string }>;
  };
  get_sprint_issues: {
    total_issues: number;
    total_story_points: number;
    filters_applied: {
      sprint_ids: number[];
      assignees: string[] | null;
      status_filters: string[] | null;
      keyword: string | null;
    };
    sprints: Record<
      string,
      {
        issue_count: number;
        issues: Array<{
          key: string;
          key_link: string;
          summary: string;
          status: string;
          assignee: string | null;
          story_points: number | null;
        }>;
      }
    >;
  };
  get_issue: {
    key: string;
    summary: string;
    description: string | null;
    status: string;
    assignee: string | null;
    assignee_display_name: string | null;
    story_points: number | null;
    issue_type: string;
    comments: Array<{ author: string; body: string; created: string }>;
  };
};
