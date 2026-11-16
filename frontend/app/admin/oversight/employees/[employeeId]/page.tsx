"use client";

import { useParams } from "next/navigation";
import { EmployeeDetail } from "@/components/oversight/EmployeeDetail";

export default function AdminEmployeeOversightPage() {
  const params = useParams<{ employeeId: string }>();
  return <EmployeeDetail base="/admin/oversight" employeeId={Number(params.employeeId)} />;
}
