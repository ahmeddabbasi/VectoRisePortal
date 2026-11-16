"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { TeamDetail } from "@/components/oversight/TeamDetail";
import { PageSkeleton } from "@/components/oversight/Chrome";

export default function EmployeeTeamOversightPage() {
  const params = useParams<{ employeeId: string }>();
  return <Suspense fallback={<PageSkeleton />}><TeamDetail base="/employee/oversight" employeeId={Number(params.employeeId)} /></Suspense>;
}
