import { jiraClient } from "./client";
import { JIRA_CONFIG } from "../constants";
import type { JiraSprint, TeamMember } from "./types";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheData {
  sprints: JiraSprint[];
  statuses: string[];
  teamMembers: TeamMember[];
  lastFetched: number;
}

let cache: CacheData | null = null;

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  if (!cache) return false;
  return Date.now() - cache.lastFetched < CACHE_TTL_MS;
}

/**
 * Fetch statuses and team members from recent sprint issues
 */
async function fetchStatusesAndTeam(boardId: number): Promise<{ statuses: string[]; teamMembers: TeamMember[] }> {
  const sprints = await jiraClient.listSprints(boardId, "all", 5);
  const statusSet = new Set<string>();
  const memberMap = new Map<string, string>();

  for (const sprint of sprints) {
    const issues = await jiraClient.getSprintIssues(sprint.id);
    for (const issue of issues.issues) {
      if (issue.status) {
        statusSet.add(issue.status);
      }
      if (issue.assignee && issue.assignee_display_name) {
        memberMap.set(issue.assignee, issue.assignee_display_name);
      }
    }
  }

  const teamMembers = [...memberMap.entries()]
    .map(([email, name]) => ({ email, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    statuses: [...statusSet].sort(),
    teamMembers,
  };
}

/**
 * Refresh the cache with fresh data from Jira
 */
export async function refreshCache(): Promise<CacheData> {
  if (!JIRA_CONFIG.boardId) {
    throw new Error("JIRA_BOARD_ID not configured in environment");
  }

  const boardId = JIRA_CONFIG.boardId;
  const [allSprints, { statuses, teamMembers }] = await Promise.all([
    jiraClient.listSprints(boardId, "all", 20),
    fetchStatusesAndTeam(boardId),
  ]);

  const sprints = allSprints.filter(
    (sprint) => sprint.state === "active" || sprint.state === "closed"
  );

  cache = {
    sprints,
    statuses,
    teamMembers,
    lastFetched: Date.now(),
  };

  return cache;
}

/**
 * Get cached sprints (fetches if cache is empty or expired)
 */
export async function getCachedSprints(): Promise<JiraSprint[]> {
  if (!isCacheValid()) {
    await refreshCache();
  }
  return cache!.sprints;
}

/**
 * Get cached statuses (fetches if cache is empty or expired)
 */
export async function getCachedStatuses(): Promise<string[]> {
  if (!isCacheValid()) {
    await refreshCache();
  }
  return cache!.statuses;
}

/**
 * Get cached team members (fetches if cache is empty or expired)
 */
export async function getCachedTeamMembers(): Promise<TeamMember[]> {
  if (!isCacheValid()) {
    await refreshCache();
  }
  return cache!.teamMembers;
}

/**
 * Get all cached data (fetches if cache is empty or expired)
 */
export async function getCachedData(): Promise<CacheData> {
  if (!isCacheValid()) {
    await refreshCache();
  }
  return cache!;
}

/**
 * Force refresh the cache regardless of TTL
 */
export async function forceRefresh(): Promise<CacheData> {
  return refreshCache();
}

/**
 * Get cache status info
 */
export function getCacheInfo(): { valid: boolean; age: number | null; expiresIn: number | null } {
  if (!cache) {
    return { valid: false, age: null, expiresIn: null };
  }
  const age = Date.now() - cache.lastFetched;
  return {
    valid: isCacheValid(),
    age,
    expiresIn: CACHE_TTL_MS - age,
  };
}

