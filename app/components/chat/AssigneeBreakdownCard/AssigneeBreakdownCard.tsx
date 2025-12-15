"use client";

export interface AssigneeStats {
  name: string;
  email: string;
  points: number;
  tasks: number;
}

export interface AssigneeBreakdownData {
  type: "assignee_breakdown";
  sprint_name: string;
  total_points: number;
  total_tasks: number;
  assignees: AssigneeStats[];
}

interface AssigneeBreakdownCardProps {
  data: AssigneeBreakdownData;
}

export function AssigneeBreakdownCard({ data }: AssigneeBreakdownCardProps) {
  const maxPoints = Math.max(...data.assignees.map((assignee) => assignee.points), 1);

  return (
    <div className="border border-[var(--bg-highlight)] rounded-lg overflow-hidden">
      <div className="bg-[var(--bg-highlight)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <div>
            <div className="font-medium text-[var(--fg)]">
              Story Points by Assignee
            </div>
            <div className="text-sm text-[var(--fg-muted)]">
              {data.sprint_name} • {data.total_points} pts • {data.total_tasks} tasks
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[var(--bg-highlight)]">
        {data.assignees.map((assignee, index) => {
          const percentage = (assignee.points / maxPoints) * 100;
          const isTop = index === 0;

          return (
            <div
              key={assignee.email}
              className="px-4 py-2 hover:bg-[var(--bg-highlight)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[var(--fg-muted)] text-sm shrink-0 w-5">
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium truncate ${isTop ? "text-[var(--green)]" : "text-[var(--fg)]"}`}>
                      {assignee.name}
                    </span>
                    <span className="text-sm text-[var(--fg-muted)] shrink-0">
                      {assignee.points} pts ({assignee.tasks} tasks)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isTop ? "bg-[var(--green)]" : "bg-[var(--blue)]"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

