"use client";

import { Suspense } from "react";
import { Overview } from "@/components/oversight/Overview";
import { PageSkeleton } from "@/components/oversight/Chrome";

export default function AdminOversightPage() {
  return <Suspense fallback={<PageSkeleton />}><Overview base="/admin/oversight" /></Suspense>;
}
