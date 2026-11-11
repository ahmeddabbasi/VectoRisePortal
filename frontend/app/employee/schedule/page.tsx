"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { RuleViolationAlert } from "@/components/RuleViolationAlert";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { getApiError, type ViolationDetail } from "@/lib/violations";
import { DAY_NAMES, addDays, formatDateISO, getMonday } from "@/lib/dates";

type DayForm = {
  day_of_week: number;
  is_working_day: boolean;
  start_time: string;
  end_time: string;
  break_minutes: number;
  notes: string;
};

const defaultDays = (): DayForm[] =>
  [0, 1, 2, 3, 4].map((d) => ({
    day_of_week: d,
    is_working_day: true,
    start_time: "09:00",
    end_time: "17:00",
    break_minutes: 60,
    notes: "",
  }));

export default function EmployeeSchedulePage() {
  const [weekStart, setWeekStart] = useState(formatDateISO(getMonday()));
  const [days, setDays] = useState<DayForm[]>(defaultDays());
  const [existing, setExisting] = useState<any[]>([]);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<ViolationDetail | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [changeProposal, setChangeProposal] = useState("");

  useEffect(() => {
    api.getSchedule(weekStart).then((rows) => {
      setExisting(rows);
      setLocked(rows.some((r: any) => r.status === "locked"));
      if (rows.length) {
        setDays(
          [0, 1, 2, 3, 4].map((d) => {
            const row = rows.find((r: any) => r.day_of_week === d);
            return row
              ? {
                  day_of_week: d,
                  is_working_day: row.is_working_day,
                  start_time: row.start_time?.slice(0, 5) || "09:00",
                  end_time: row.end_time?.slice(0, 5) || "17:00",
                  break_minutes: row.break_minutes || 60,
                  notes: row.notes || "",
                }
              : defaultDays()[d];
          })
        );
      }
    }).catch(() => setExisting([]));
  }, [weekStart]);

  async function submit() {
    setMessage(null);
    setAlert(null);
    try {
      await api.submitSchedule({ week_start: weekStart, days });
      setMessage("Schedule submitted successfully.");
      setExisting(await api.getSchedule(weekStart));
    } catch (e) {
      const { message: errMessage, violation } = getApiError(e);
      if (violation) setAlert(violation);
      else setMessage(errMessage);
    }
  }

  async function requestChange() {
    setMessage(null);
    setAlert(null);
    try {
      await api.requestScheduleChange({
        reason: changeReason,
        proposed_changes: changeProposal,
      });
      setMessage("Change request submitted for admin review.");
      setChangeReason("");
      setChangeProposal("");
    } catch (e) {
      const { message: errMessage, violation } = getApiError(e);
      if (violation) setAlert(violation);
      else setMessage(errMessage);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Employee"
        title="Work Schedule"
        description="Submit your weekly schedule by Friday. Locked schedules require admin approval to change."
      />

      <div className="card flex flex-wrap items-center gap-4 p-4">
        <label className="kpi-label">Week starting</label>
        <input
          type="date"
          className="input"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
        />
        {locked ? <StatusBadge status="locked" /> : existing.length ? <StatusBadge status="submitted" /> : <StatusBadge status="draft" />}
      </div>

      {alert ? <RuleViolationAlert violation={alert} onDismiss={() => setAlert(null)} /> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}

      <DataTable minWidth="42rem">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Working</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Break (min)</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, idx) => (
              <tr key={day.day_of_week} className="table-row">
                <td className="px-4 py-3">{DAY_NAMES[day.day_of_week]}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={day.is_working_day}
                    disabled={locked}
                    onChange={(e) => {
                      const next = [...days];
                      next[idx] = { ...day, is_working_day: e.target.checked };
                      setDays(next);
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <input className="input" type="time" value={day.start_time} disabled={locked || !day.is_working_day}
                    onChange={(e) => { const next = [...days]; next[idx] = { ...day, start_time: e.target.value }; setDays(next); }} />
                </td>
                <td className="px-4 py-3">
                  <input className="input" type="time" value={day.end_time} disabled={locked || !day.is_working_day}
                    onChange={(e) => { const next = [...days]; next[idx] = { ...day, end_time: e.target.value }; setDays(next); }} />
                </td>
                <td className="px-4 py-3">
                  <input className="input w-20" type="number" value={day.break_minutes} disabled={locked || !day.is_working_day}
                    onChange={(e) => { const next = [...days]; next[idx] = { ...day, break_minutes: Number(e.target.value) }; setDays(next); }} />
                </td>
                <td className="px-4 py-3">
                  <input className="input" value={day.notes} disabled={locked}
                    onChange={(e) => { const next = [...days]; next[idx] = { ...day, notes: e.target.value }; setDays(next); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>

      {!locked ? (
        <button type="button" className="btn-primary" onClick={submit}>Submit Schedule</button>
      ) : (
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-lg">Schedule Change Request</h2>
          <input className="input w-full" placeholder="Reason for change" value={changeReason} onChange={(e) => setChangeReason(e.target.value)} />
          <textarea className="input w-full min-h-24" placeholder="Describe proposed changes" value={changeProposal} onChange={(e) => setChangeProposal(e.target.value)} />
          <button type="button" className="btn-secondary" onClick={requestChange}>Submit Change Request</button>
        </div>
      )}
    </div>
  );
}
