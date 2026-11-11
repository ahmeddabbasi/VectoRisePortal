"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RuleViolationAlert } from "@/components/RuleViolationAlert";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { getApiError, guideForException, type ViolationDetail } from "@/lib/violations";

export default function EmployeeExceptionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [explaining, setExplaining] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [alert, setAlert] = useState<ViolationDetail | null>(null);

  useEffect(() => {
    api.employeeExceptions().then(setItems).catch(() => setItems([]));
  }, []);

  async function submitExplanation(id: number) {
    setAlert(null);
    try {
      await api.explainException(id, text);
      setExplaining(null);
      setText("");
      setItems(await api.employeeExceptions());
    } catch (err) {
      const { violation } = getApiError(err);
      if (violation) setAlert(violation);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Employee" title="My Exceptions" description="View attendance and schedule exceptions. Provide explanations when requested." />
      {alert ? <RuleViolationAlert violation={alert} onDismiss={() => setAlert(null)} /> : null}
      {items.length === 0 ? <EmptyState title="No exceptions" description="You're all clear — no open exceptions on your record." /> : null}
      {items.map((item) => {
        const guide = guideForException(item.exception_type);
        return (
          <div key={item.id} className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-lg">{item.title}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            {guide && item.status === "open" ? (
              <RuleViolationAlert className="mt-4" violation={guide} />
            ) : null}
            {item.employee_explanation ? <p className="mt-3 text-sm">Your explanation: {item.employee_explanation}</p> : null}
            {item.admin_response ? <p className="mt-2 text-sm text-brand">Admin: {item.admin_response}</p> : null}
            {item.status === "rejected" ? (
              <RuleViolationAlert
                className="mt-4"
                violation={{
                  code: "exception_rejected",
                  title: "Exception not approved",
                  message: item.admin_response || "Admin did not approve this exception.",
                  severity: "error",
                  link: "/employee/exceptions",
                  steps: [
                    "Review the admin response above.",
                    "Contact your manager if you need to dispute the decision.",
                    "Submit a new explanation only if admin asks you to clarify.",
                  ],
                }}
              />
            ) : null}
            {item.status === "open" && explaining !== item.id ? (
              <button type="button" className="btn-secondary mt-4 text-xs" onClick={() => setExplaining(item.id)}>Provide Explanation</button>
            ) : null}
            {explaining === item.id ? (
              <div className="mt-4 space-y-2">
                <textarea className="input w-full min-h-20" value={text} onChange={(e) => setText(e.target.value)} placeholder="Explain what happened and any supporting details..." />
                <button type="button" className="btn-primary text-xs" onClick={() => submitExplanation(item.id)} disabled={!text.trim()}>Submit</button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
