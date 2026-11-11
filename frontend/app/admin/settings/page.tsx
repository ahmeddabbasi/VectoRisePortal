"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

const SETTING_LABELS: Record<string, string> = {
  check_in_grace_minutes: "Check-in grace period (minutes)",
  check_out_grace_minutes: "Check-out grace period (minutes)",
  schedule_deadline_day: "Schedule deadline day (0=Mon, 4=Fri)",
  daily_required_hours: "Daily required hours",
  daily_max_hours: "Daily maximum hours",
  weekly_required_hours: "Weekly required hours",
  weight_attendance: "Attendance weight %",
  weight_task_completion: "Task completion weight %",
  weight_deadline: "Deadline adherence weight %",
  weight_schedule: "Schedule adherence weight %",
  weight_evaluation: "HR evaluation weight %",
  missed_schedule_penalty: "Missed schedule penalty points",
  default_start_time: "Default start time",
  default_end_time: "Default end time",
};

export default function AdminWorkforceSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.adminSettings().then(setSettings);
  }, []);

  async function save() {
    setMessage(null);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setMessage("Settings saved.");
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Workforce Settings" description="Configure grace periods, working hours, penalties, and performance weights." />
      {message ? <p className="text-sm text-brand">{message}</p> : null}
      <div className="card space-y-4 p-6">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="grid gap-2 md:grid-cols-2 md:items-center">
            <label className="text-sm font-medium">{SETTING_LABELS[key] || key}</label>
            <input className="input" value={value} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
          </div>
        ))}
        <button type="button" className="btn-primary" onClick={save}>Save Settings</button>
      </div>
    </div>
  );
}
