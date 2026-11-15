"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { TeamHierarchy } from "@/components/TeamHierarchy";
import { api } from "@/lib/api";

export default function PersonPage() {
  const params = useParams<{ id: string }>();
  const [person, setPerson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params.id);
    if (!id) return;
    setError(null);
    api.teamPerson(id).then(setPerson).catch((err: Error) => setError(err.message));
  }, [params.id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!person) return <p>Loading profile...</p>;

  const relationship = person.relationship === "team_lead"
    ? "Your team lead"
    : person.relationship === "report"
      ? "You lead this person"
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team"
        title={person.employee?.name || "Employee"}
        description={person.employee?.job_title || "Team member"}
      />
      {relationship ? <p className="text-sm text-muted-foreground">{relationship}</p> : null}
      {person.relationship === "self" ? <TeamHierarchy summary={person} /> : null}
    </div>
  );
}
