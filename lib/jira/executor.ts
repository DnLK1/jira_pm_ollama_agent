import { jiraClient } from "./client";
import { getCachedTeamMembers } from "./cache";
import { JIRA_CONFIG } from "../constants";
import type { ToolName, ToolResultMap, JiraSprintIssues } from "./types";
import type { ToolCallInput } from "../types";

type PrepareSearchResult = ToolResultMap["prepare_search"];
type GetSprintIssuesResult = ToolResultMap["get_sprint_issues"];
type GetIssueResult = ToolResultMap["get_issue"];

export async function executeJiraTool(
  toolCall: ToolCallInput
): Promise<PrepareSearchResult | GetSprintIssuesResult | GetIssueResult> {
  const { name, arguments: args } = toolCall;

  switch (name as ToolName) {
    case "prepare_search": {
      const names = (args.names as string[]) || [];
      let sprintIds = args.sprint_ids as number[] | undefined;

      if (!JIRA_CONFIG.boardId) {
        throw new Error("DEFAULT_BOARD_ID not configured in environment");
      }

      const [boardInfo, allSprints, cachedTeam] = await Promise.all([
        jiraClient.getBoardInfo(JIRA_CONFIG.boardId),
        jiraClient.listSprints(JIRA_CONFIG.boardId, "all", 50),
        getCachedTeamMembers(),
      ]);

      if (!sprintIds || sprintIds.length === 0) {
        const activeSprint = allSprints.find(
          (sprint) => sprint.state === "active"
        );
        sprintIds = activeSprint ? [activeSprint.id] : [allSprints[0]?.id];
      } else {
        const validSprintIds = allSprints.map((sprint) => sprint.id);
        const invalidIds = sprintIds.filter(
          (id) => !validSprintIds.includes(id)
        );
        if (invalidIds.length > 0) {
          throw new Error(
            `Invalid sprint IDs: ${invalidIds.join(
              ", "
            )}. Locate the correct IDs from AVAILABLE SPRINTS list.`
          );
        }
      }

      const teamEmails = cachedTeam.map((member) => member.email);

      const sprintInfos: Array<{ id: number; name: string; state: string }> =
        sprintIds.map((sprintId) => {
          const sprint = allSprints.find((sp) => sp.id === sprintId)!;
          return { id: sprint.id, name: sprint.name, state: sprint.state };
        });

      if (names.length === 0) {
        return {
          all_team: true,
          team_members: teamEmails,
          board: { name: boardInfo.name, project_name: boardInfo.project_name },
          sprints: sprintInfos,
        };
      }

      const people = names.map((nameInput) => {
        const nameLower = nameInput.toLowerCase().trim();
        const nameParts = nameLower.split(/\s+/);

        let matchingMembers = cachedTeam.filter((member) => {
          const nameLowerMember = member.name.toLowerCase();
          const emailLower = member.email.toLowerCase();
          return nameParts.every(
            (part) =>
              nameLowerMember.includes(part) || emailLower.includes(part)
          );
        });

        if (matchingMembers.length === 0) {
          matchingMembers = cachedTeam.filter((member) => {
            const nameLowerMember = member.name.toLowerCase();
            const emailLower = member.email.toLowerCase();
            return nameParts.some(
              (part) =>
                nameLowerMember.includes(part) || emailLower.includes(part)
            );
          });
        }

        const matchingEmails = matchingMembers.map((member) => member.email);

        return {
          name: nameInput,
          resolved_email:
            matchingEmails.length === 1 ? matchingEmails[0] : null,
          possible_matches: matchingEmails.length > 1 ? matchingEmails : [],
          not_found: matchingEmails.length === 0,
        };
      });

      return {
        all_team: false,
        people,
        board: { name: boardInfo.name, project_name: boardInfo.project_name },
        sprints: sprintInfos,
      };
    }

    case "get_sprint_issues": {
      const sprintIds = args.sprint_ids as number[];
      if (!sprintIds || sprintIds.length === 0) {
        throw new Error("sprint_ids is required");
      }

      const boardSprints = await jiraClient.listSprints(
        JIRA_CONFIG.boardId!,
        "all",
        50
      );
      const validSprintIds = boardSprints.map((sprint) => sprint.id);

      const invalidIds = sprintIds.filter((id) => !validSprintIds.includes(id));
      if (invalidIds.length > 0) {
        throw new Error(
          `Invalid sprint IDs: ${invalidIds.join(
            ", "
          )}. Locate the correct IDs from AVAILABLE SPRINTS list.`
        );
      }

      const assigneeInput = (args.assignees || args.assignee_emails) as
        | string[]
        | undefined;
      const statusFilters = args.status_filters as string[] | undefined;
      const keyword = args.keyword as string | undefined;

      const cachedTeam = await getCachedTeamMembers();
      const resolvedEmails = assigneeInput?.map((input) => {
        if (input.includes("@")) return input.toLowerCase();

        const inputLower = input.toLowerCase();
        const match = cachedTeam.find(
          (member) =>
            member.name.toLowerCase().includes(inputLower) ||
            member.email.toLowerCase().includes(inputLower)
        );
        return match?.email.toLowerCase() || input.toLowerCase();
      });

      const sprintResults = await Promise.all(
        sprintIds.map(async (sprintId) => {
          const result: JiraSprintIssues = await jiraClient.getSprintIssues(
            sprintId
          );

          const sprintInfo = boardSprints.find(
            (sprint) => sprint.id === sprintId
          );

          let filteredIssues = result.issues;

          if (resolvedEmails?.length) {
            filteredIssues = filteredIssues.filter(
              (issue) =>
                issue.assignee &&
                resolvedEmails.includes(issue.assignee.toLowerCase())
            );
          }

          if (statusFilters?.length) {
            filteredIssues = filteredIssues.filter((issue) =>
              statusFilters.some((statusFilter) => {
                const filterLower = statusFilter.toLowerCase();
                const issueStatusLower = issue.status.toLowerCase();

                if (filterLower === "done")
                  return /done|concluído|completed/i.test(issue.status);
                if (filterLower === "in_progress")
                  return /progress|progresso/i.test(issue.status);
                if (filterLower === "todo")
                  return /backlog|todo|to do|new/i.test(issue.status);

                return issueStatusLower === filterLower;
              })
            );
          }

          if (keyword) {
            const keywordLower = keyword.toLowerCase();
            filteredIssues = filteredIssues.filter((issue) =>
              issue.summary.toLowerCase().includes(keywordLower)
            );
          }

          const sortedIssues = filteredIssues.sort((a, b) =>
            a.key.localeCompare(b.key, undefined, { numeric: true })
          );

          const formattedIssues = sortedIssues.map((issue) => ({
            key: issue.key,
            key_link: `[${issue.key}](${JIRA_CONFIG.baseUrl}/browse/${issue.key})`,
            summary: issue.summary,
            status: issue.status,
            assignee: issue.assignee,
            story_points: issue.story_points,
          }));

          return {
            sprint_id: sprintId,
            sprint_name: sprintInfo?.name || `Sprint ${sprintId}`,
            issue_count: formattedIssues.length,
            issues: formattedIssues,
          };
        })
      );

      const totalIssues = sprintResults.reduce(
        (sum, sprintResult) => sum + sprintResult.issue_count,
        0
      );
      const totalPoints = sprintResults.reduce(
        (sum, sprintResult) =>
          sum +
          sprintResult.issues.reduce(
            (pts, issue) => pts + (issue.story_points || 0),
            0
          ),
        0
      );

      const sprints: Record<
        string,
        { issue_count: number; issues: (typeof sprintResults)[0]["issues"] }
      > = {};
      for (const result of sprintResults) {
        sprints[result.sprint_name] = {
          issue_count: result.issue_count,
          issues: result.issues,
        };
      }

      return {
        total_issues: totalIssues,
        total_story_points: totalPoints,
        filters_applied: {
          sprint_ids: sprintIds,
          assignees: resolvedEmails || null,
          status_filters: statusFilters || null,
          keyword: keyword || null,
        },
        sprints,
      };
    }

    case "get_issue": {
      const issueKey = args.issue_key as string;
      if (!issueKey) {
        throw new Error("issue_key is required");
      }

      const issue = await jiraClient.getIssue(issueKey);
      return issue;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export function isValidToolName(name: string): name is ToolName {
  const validTools: ToolName[] = [
    "prepare_search",
    "get_sprint_issues",
    "get_issue",
  ];
  return validTools.includes(name as ToolName);
}
