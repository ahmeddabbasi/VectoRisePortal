"use client";

import { Suspense } from "react";
import { ActivityFeed } from "@/components/oversight/ActivityFeed";
import { PageSkeleton } from "@/components/oversight/Chrome";

export default function AdminActivityPage() {
  return <Suspense fallback={<PageSkeleton />}><ActivityFeed base="/admin/oversight" /></Suspense>;
}
