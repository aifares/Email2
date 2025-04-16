"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";

type ClassificationType = {
  classification: string;
  count: number;
};

type SentimentType = {
  sentiment: string;
  count: number;
};

type VolumeType = {
  month: string;
  count: number;
};

type TrendDataType = {
  month: string;
  score: number;
  count: number;
};

type MetricsType = {
  totalCount: number;
  avgScore: number;
  trending: string;
  trendingClass: string;
  trendingDirection: string;
  topSender: string;
  responseRate: number;
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("month");
  const [selectedClassification, setSelectedClassification] = useState("all");
  const [selectedSentiment, setSelectedSentiment] = useState("all");

  // Data states
  const [classificationData, setClassificationData] = useState<
    ClassificationType[]
  >([]);
  const [sentimentData, setSentimentData] = useState<SentimentType[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeType[]>([]);
  const [trendData, setTrendData] = useState<TrendDataType[]>([]);
  const [metrics, setMetrics] = useState<MetricsType | null>(null);

  // Colors for charts
  const COLORS = [
    "#6366f1", // indigo (primary)
    "#64748b", // slate
    "#f97316", // orange
    "#06b6d4", // cyan
    "#10b981", // green
    "#8b5cf6", // purple
    "#f43f5e", // rose
    "#ec4899", // pink
  ];

  const SENTIMENT_COLORS = {
    positive: "#6366f1", // indigo (primary)
    neutral: "#f97316", // orange
    negative: "#64748b", // slate
  };

  useEffect(() => {
    if (!user) return;

    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all analytics in single request
        const response = await fetch(
          `http://localhost:3001/analytics/all?firebaseUid=${user.uid}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch analytics data");

        const data = await response.json();
        setClassificationData(data.classification || []);
        setSentimentData(data.sentiment || []);
        setVolumeData(data.volume || []);

        // Fetch sentiment trend for positive sentiment
        await fetchSentimentTrend("positive");

        // Fetch metrics for all data
        await fetchMetrics();
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

  const fetchSentimentTrend = async (sentimentFilter = selectedSentiment) => {
    if (!user) return;
    if (sentimentFilter === "all") sentimentFilter = "positive";

    try {
      const response = await fetch(
        `http://localhost:3001/analytics/sentiment-trend?firebaseUid=${user.uid}&sentiment=${sentimentFilter}&months=6`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch trend data");

      const data = await response.json();
      setTrendData(data.data || []);
    } catch (err) {
      console.error("Error fetching sentiment trend:", err);
    }
  };

  const fetchMetrics = async (filter = selectedClassification) => {
    if (!user) return;

    try {
      let url = `http://localhost:3001/analytics/metrics?firebaseUid=${user.uid}`;
      if (filter !== "all") {
        url += `&classification=${filter}`;
      } else {
        url += `&sentiment=positive`;
      }

      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch metrics");

      const data = await response.json();
      setMetrics(data.metrics || null);
    } catch (err) {
      console.error("Error fetching metrics:", err);
    }
  };

  const handleClassificationChange = (classification: string) => {
    setSelectedClassification(classification);
    fetchMetrics(classification);
  };

  const handleSentimentChange = (sentiment: string) => {
    setSelectedSentiment(sentiment);
    fetchSentimentTrend(sentiment);
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    // Here you could fetch data with the new timeframe
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-error/10 text-error p-4 rounded-lg">
          <p>{error}</p>
          <button
            className="btn btn-error btn-sm mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Analytics</h1>
          <p className="text-base-content/70">Insights from your email data</p>
        </div>

        <div className="join">
          <button
            className={`join-item btn btn-sm ${
              timeframe === "day" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => handleTimeframeChange("day")}
          >
            Day
          </button>
          <button
            className={`join-item btn btn-sm ${
              timeframe === "week" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => handleTimeframeChange("week")}
          >
            Week
          </button>
          <button
            className={`join-item btn btn-sm ${
              timeframe === "month" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => handleTimeframeChange("month")}
          >
            Month
          </button>
        </div>
      </header>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <span className="icon-[tabler--mail-filled] text-primary size-6"></span>
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">
                Total Emails
              </p>
              <h3 className="text-3xl font-bold mt-1">
                {metrics?.totalCount || 0}
              </h3>
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-sm ${
                metrics?.trendingClass || "text-primary/80"
              }`}
            >
              {metrics?.trendingDirection || "↑"} {metrics?.trending || "0%"}
            </span>
            <span className="text-sm text-base-content/50 ml-1">
              vs last month
            </span>
          </div>
        </div>

        <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-secondary/10 p-3 rounded-full">
              <span className="icon-[tabler--mood-smile] text-secondary size-6"></span>
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">
                Sentiment Score
              </p>
              <h3 className="text-3xl font-bold mt-1">
                {metrics?.avgScore?.toFixed(2) || "0.00"}
              </h3>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm text-base-content/50">
              Average across all emails
            </span>
          </div>
        </div>

        <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <span className="icon-[tabler--user-circle] text-primary size-6"></span>
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">
                Top Sender
              </p>
              <h3 className="text-2xl font-bold mt-1 truncate max-w-[150px]">
                {metrics?.topSender || "Unknown"}
              </h3>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm text-base-content/50">
              Most frequent contact
            </span>
          </div>
        </div>

        <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-success/10 p-3 rounded-full">
              <span className="icon-[tabler--message-check] text-success size-6"></span>
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">
                Response Rate
              </p>
              <h3 className="text-3xl font-bold mt-1">
                {metrics?.responseRate || 0}%
              </h3>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm text-base-content/50">
              Emails with replies
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classification Distribution Chart */}
        <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-lg">Email Classification</h2>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                <span className="icon-[tabler--dots-vertical]"></span>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <a onClick={() => handleClassificationChange("all")}>
                    View All
                  </a>
                </li>
                {classificationData.slice(0, 5).map((item) => (
                  <li key={item.classification}>
                    <a
                      onClick={() =>
                        handleClassificationChange(item.classification)
                      }
                    >
                      {item.classification}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classificationData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0"
                />
                <XAxis type="number" />
                <YAxis
                  dataKey="classification"
                  type="category"
                  width={100}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(value) =>
                    value.length > 12 ? `${value.substring(0, 12)}...` : value
                  }
                />
                <Tooltip
                  formatter={(value: any) => [`${value} emails`, "Count"]}
                  labelFormatter={(value) => `Classification: ${value}`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution Chart */}
        <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-lg">Sentiment Distribution</h2>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                <span className="icon-[tabler--dots-vertical]"></span>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <a onClick={() => handleSentimentChange("all")}>View All</a>
                </li>
                <li>
                  <a onClick={() => handleSentimentChange("positive")}>
                    Positive
                  </a>
                </li>
                <li>
                  <a onClick={() => handleSentimentChange("neutral")}>
                    Neutral
                  </a>
                </li>
                <li>
                  <a onClick={() => handleSentimentChange("negative")}>
                    Negative
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  innerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="sentiment"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {sentimentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        SENTIMENT_COLORS[
                          entry.sentiment as keyof typeof SENTIMENT_COLORS
                        ] || COLORS[index % COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} emails`, "Count"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Email Volume Chart */}
        <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm">
          <h2 className="font-semibold text-lg mb-6">Email Volume Trend</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={volumeData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} emails`, "Count"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stackId="1"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Trend Chart */}
        <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-lg">Sentiment Trend</h2>
            <div className="badge badge-primary gap-1">
              <span className="icon-[tabler--mood-happy] size-4"></span>
              {selectedSentiment === "all" ? "Positive" : selectedSentiment}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  name="Sentiment Score"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="count"
                  stroke="#f97316"
                  name="Email Count"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
