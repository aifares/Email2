import {
  Mail,
  Bot as Robot,
  Clock,
  ChartLine as ChartLineUp,
} from "lucide-react";

interface DashboardStatsProps {
  totalEmails: number;
  isAnalyzing: boolean;
  handleAnalyzeAll: () => void;
}

export const DashboardStats = ({
  totalEmails,
  isAnalyzing,
  handleAnalyzeAll,
}: DashboardStatsProps) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
    <div className="card bg-base-100 border border-base-200 shadow-sm">
      <div className="card-body p-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-base-content/70">
            Total Emails
          </h2>
          <Mail className="text-primary size-5" />
        </div>
        <p className="text-xl font-bold mt-1">{totalEmails || 0}</p>
        <p className="text-xs text-base-content/70">Synced with Gmail</p>
      </div>
    </div>

    <div className="card bg-base-100 border border-base-200 shadow-sm">
      <div className="card-body p-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-base-content/70">
            Active Agents
          </h2>
          <Robot className="text-primary size-5" />
        </div>
        <p className="text-xl font-bold mt-1">3</p>
        <p className="text-xs text-base-content/70">2 automatic responses</p>
      </div>
    </div>

    <div className="card bg-base-100 border border-base-200 shadow-sm">
      <div className="card-body p-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-base-content/70">
            Time Saved
          </h2>
          <Clock className="text-primary size-5" />
        </div>
        <p className="text-xl font-bold mt-1">5.2 hrs</p>
        <p className="text-xs text-base-content/70">This week</p>
      </div>
    </div>

    <div className="card bg-base-100 border border-base-200 shadow-sm">
      <div className="card-body p-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-base-content/70">
            Response Rate
          </h2>
          <ChartLineUp className="text-primary size-5" />
        </div>
        <p className="text-xl font-bold mt-1">92%</p>
        <p className="text-xs text-base-content/70">+5% from last month</p>
      </div>
    </div>
  </div>
);
