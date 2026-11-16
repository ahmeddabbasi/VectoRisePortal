"use client";

import { useParams } from "next/navigation";
import { EmployeeDetail } from "@/components/oversight/EmployeeDetail";

export default function EmployeePersonOversightPage() {
  const params = useParams<{ employeeId: string }>();
  return <EmployeeDetail base="/employee/oversight" employeeId={Number(params.employeeId)} />;
}
