import fs from "fs";
import path from "path";

interface Checkpoint {
  id: string;
  name: string;
  status: string;
  timestamp: string | null;
  notes: string;
  evidence: string;
}

interface Agent {
  id: number;
  name: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  checkpoints: Checkpoint[];
}

interface DeploymentStatus {
  lastUpdated: string;
  currentAgent: string;
  overallProgress: number;
  agents: Agent[];
}

function getStatus(): DeploymentStatus {
  const filePath = path.join(process.cwd(), "public", "deployment-status.json");
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function statusColor(status: string) {
  switch (status) {
    case "pass":
    case "complete":
      return "bg-green-500";
    case "running":
    case "in_progress":
      return "bg-yellow-500";
    case "fail":
      return "bg-red-500";
    case "skipped":
      return "bg-gray-300";
    default:
      return "bg-gray-200";
  }
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pass: "bg-green-100 text-green-800",
    complete: "bg-green-100 text-green-800",
    running: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    fail: "bg-red-100 text-red-800",
    skipped: "bg-gray-100 text-gray-500",
    pending: "bg-gray-100 text-gray-600",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

export const dynamic = "force-dynamic";

export default function DeploymentDashboard() {
  const status = getStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Deployment Pipeline
          </h1>
          <p className="text-sm text-gray-500">
            {status.currentAgent}
            {status.lastUpdated &&
              ` · Updated ${new Date(status.lastUpdated).toLocaleString("en-GB")}`}
          </p>
        </div>

        {/* Overall progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {status.overallProgress}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${status.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Agent cards */}
        <div className="space-y-4">
          {status.agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${statusColor(agent.status)}`}
                  />
                  <h2 className="font-semibold text-gray-900">
                    Agent {agent.id} — {agent.name}
                  </h2>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(agent.status)}`}
                >
                  {agent.status}
                </span>
              </div>

              {agent.checkpoints.length > 0 && (
                <div className="px-5 py-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                        <th className="pb-2 pr-4">Checkpoint</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 pr-4 hidden md:table-cell">
                          Time
                        </th>
                        <th className="pb-2 hidden md:table-cell">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agent.checkpoints.map((cp) => (
                        <tr key={cp.id} className="border-t border-gray-50">
                          <td className="py-2 pr-4">
                            <span className="font-mono text-xs text-gray-400 mr-2">
                              {cp.id}
                            </span>
                            {cp.name}
                          </td>
                          <td className="py-2 pr-4">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(cp.status)}`}
                            >
                              {cp.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-gray-400 text-xs hidden md:table-cell">
                            {cp.timestamp
                              ? new Date(cp.timestamp).toLocaleTimeString(
                                  "en-GB",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "—"}
                          </td>
                          <td className="py-2 text-gray-500 text-xs hidden md:table-cell">
                            {cp.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {agent.checkpoints.length === 0 && agent.status === "skipped" && (
                <div className="px-5 py-3 text-sm text-gray-400 italic">
                  Skipped
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
