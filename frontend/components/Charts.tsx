"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART } from "@/lib/brand";

const ACTIVITY_SERIES = [
  { key: "emails", label: "Initial Emails", color: CHART.email },
  { key: "follow_ups", label: "Follow-ups", color: CHART.followUp },
  { key: "linkedin", label: "LinkedIn", color: CHART.linkedin },
  { key: "replies", label: "Replies", color: CHART.reply },
];

const chartTooltipStyle = {
  background: CHART.tooltipBg,
  border: `1px solid ${CHART.tooltipBorder}`,
  borderRadius: "6px",
  fontSize: "12px",
};

function formatChartDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function normalizeActivityRow(row: Record<string, unknown>) {
  const emails = Number(row.emails ?? 0);
  const followUps = Number(row.follow_ups ?? 0);
  const linkedin = Number(row.linkedin ?? 0);
  const replies = Number(row.replies ?? 0);
  const total = Number(row.total ?? emails + followUps + linkedin + replies);

  return {
    date: String(row.date),
    label: formatChartDate(String(row.date)),
    emails,
    follow_ups: followUps,
    linkedin,
    replies,
    total,
    outreach: emails + followUps + linkedin,
  };
}

function ActivityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ReturnType<typeof normalizeActivityRow> }> }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div
      className="rounded-2xl p-3 text-xs shadow-2xl"
      style={{ background: CHART.tooltipBg, border: `1px solid ${CHART.tooltipBorder}` }}
    >
      <p className="mb-2 font-medium text-ink">{row.label}</p>
      <div className="space-y-1">
        {ACTIVITY_SERIES.map((series) => {
          const value = row[series.key as keyof typeof row] as number;
          if (!value) return null;
          return (
            <div key={series.key} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: series.color }} />
                {series.label}
              </span>
              <span className="font-medium text-ink">{value}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 space-y-1 border-t border-ink/10 pt-2 text-muted-foreground">
        <div className="flex justify-between gap-6">
          <span>Outreach sent</span>
          <span className="text-ink">{row.outreach}</span>
        </div>
        <div className="flex justify-between gap-6 font-medium">
          <span>Total activity</span>
          <span className="text-ink">{row.total}</span>
        </div>
      </div>
    </div>
  );
}

export function ActivityTrendChart({ data }: { data: any[] }) {
  const chartData = data.map((row) => normalizeActivityRow(row));
  const totalActivities = chartData.reduce((sum, row) => sum + row.total, 0);
  const tickInterval = chartData.length > 14 ? Math.ceil(chartData.length / 7) - 1 : 0;

  return (
    <div className="card h-[22rem] p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="chart-subtitle mb-1">02 / Volume</p>
          <h3 className="chart-title">Daily Activity Trend</h3>
        </div>
        {chartData.length > 0 ? (
          <p className="font-mono-custom text-[9px] uppercase tracking-widest text-muted-foreground">
            {chartData.length} days · {totalActivities.toLocaleString()} activities
          </p>
        ) : null}
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[85%] items-center justify-center text-sm text-muted-foreground">
          No activity recorded for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 10 }} interval={tickInterval} minTickGap={12} />
            <YAxis allowDecimals={false} tick={{ fill: CHART.axis, fontSize: 11 }} width={32} />
            <Tooltip content={<ActivityTooltip />} cursor={{ fill: "rgba(28, 138, 242, 0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => ACTIVITY_SERIES.find((s) => s.key === value)?.label ?? value} />
            {ACTIVITY_SERIES.map((series, index) => (
              <Bar
                key={series.key}
                stackId="activity"
                dataKey={series.key}
                name={series.key}
                fill={series.color}
                radius={index === ACTIVITY_SERIES.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function StageBarChart({ data }: { data: { stage: string; count: number }[] }) {
  return (
    <div className="card h-80 p-5">
      <p className="chart-subtitle mb-1">03 / Stages</p>
      <h3 className="chart-title mb-4">Current Stage Distribution</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis type="number" tick={{ fill: CHART.axis, fontSize: 11 }} />
          <YAxis dataKey="stage" type="category" width={120} tick={{ fill: CHART.axis, fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="count" fill={CHART.primary} radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FunnelChart({ data }: { data: { stage: string; count: number }[] }) {
  return (
    <div className="card h-80 p-5">
      <p className="chart-subtitle mb-1">04 / Funnel</p>
      <h3 className="chart-title mb-4">Pipeline Funnel</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis dataKey="stage" tick={{ fill: CHART.axis, fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="count" fill={CHART.secondary} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EmployeeCompareChart({ data }: { data: any[] }) {
  return (
    <div className="card h-80 p-5">
      <p className="chart-subtitle mb-1">05 / Team</p>
      <h3 className="chart-title mb-4">Employee Activity Comparison</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis dataKey="employee" tick={{ fill: CHART.axis, fontSize: 11 }} />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="initial_emails" name="Initial Emails" fill={CHART.email} />
          <Bar dataKey="follow_ups" name="Follow-ups" fill={CHART.followUp} />
          <Bar dataKey="linkedin" name="LinkedIn" fill={CHART.linkedin} />
          <Bar dataKey="replies" name="Replies" fill={CHART.reply} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HrmAttendanceBarChart({ data }: { data: { date: string; present: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
        <XAxis dataKey="date" tick={{ fill: CHART.axis, fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fill: CHART.axis, fontSize: 11 }} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Bar dataKey="present" name="Present" fill={CHART.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryCompareChart({ data }: { data: any[] }) {
  return (
    <div className="card h-80 p-5">
      <p className="chart-subtitle mb-1">06 / Categories</p>
      <h3 className="chart-title mb-4">Category Performance</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis dataKey="category" tick={{ fill: CHART.axis, fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="leads" name="Leads" fill={CHART.primary} />
          <Bar dataKey="replies" name="Replies" fill={CHART.secondary} />
          <Bar dataKey="meetings" name="Meetings" fill={CHART.tertiary} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
