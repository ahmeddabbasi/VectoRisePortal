"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { EmptyNote, Initials, LoadError, PageSkeleton } from "@/components/oversight/Chrome";

type Node = { id: number; name: string; job_title?: string; overdue_tasks: number; also_reports_to_others: boolean; is_lead: boolean; children: Node[] };

export function Hierarchy({ base }: { base: string }) {
  const router = useRouter();
  const [roots, setRoots] = useState<Node[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    api.oversightHierarchy().then((data) => {
      setRoots(data.roots || []);
      const next: Record<number, boolean> = {};
      const walk = (nodes: Node[]) => nodes.forEach((node) => { next[node.id] = true; walk(node.children || []); });
      walk(data.roots || []);
      setOpen(next);
    }).catch((err: Error) => setError(err.message));
  }, [attempt]);

  const flat = useMemo(() => {
    const rows: Node[] = [];
    const walk = (nodes: Node[]) => nodes.forEach((node) => { rows.push(node); if (open[node.id]) walk(node.children || []); });
    walk(roots || []);
    return rows;
  }, [roots, open]);

  function setAll(value: boolean) {
    const next: Record<number, boolean> = {};
    const walk = (nodes: Node[]) => nodes.forEach((node) => { next[node.id] = value; walk(node.children || []); });
    walk(roots || []);
    setOpen(next);
  }

  function onKey(event: React.KeyboardEvent<HTMLButtonElement>, node: Node, index: number) {
    if (event.key === "ArrowDown") flat[index + 1] && document.getElementById(`tree-${flat[index + 1].id}`)?.focus();
    if (event.key === "ArrowUp") flat[index - 1] && document.getElementById(`tree-${flat[index - 1].id}`)?.focus();
    if (event.key === "ArrowRight") setOpen((current) => ({ ...current, [node.id]: true }));
    if (event.key === "ArrowLeft") setOpen((current) => ({ ...current, [node.id]: false }));
    if (event.key === "Enter") router.push(node.is_lead ? `${base}/teams/${node.id}` : `${base}/employees/${node.id}`);
  }

  if (error) return <LoadError message={error} onRetry={() => setAttempt((value) => value + 1)} />;
  if (!roots) return <PageSkeleton />;
  const needle = query.trim().toLowerCase();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Oversight" title="Org hierarchy" description="Managers, the leads they manage, and those leads' direct members." />
      <div className="flex flex-wrap gap-2">
        <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a person" aria-label="Find a person" />
        <button type="button" className="btn-secondary" onClick={() => setAll(true)}>Expand all</button>
        <button type="button" className="btn-secondary" onClick={() => setAll(false)}>Collapse all</button>
      </div>
      {!roots.length ? <EmptyNote>No reporting lines yet.</EmptyNote> : (
        <div role="tree">
          {roots.map((node) => <Branch key={node.id} node={node} depth={0} open={open} setOpen={setOpen} base={base} needle={needle} flat={flat} onKey={onKey} onOpen={(item) => router.push(item.is_lead ? `${base}/teams/${item.id}` : `${base}/employees/${item.id}`)} />)}
        </div>
      )}
    </div>
  );
}

function contains(node: Node, needle: string): boolean {
  if (!needle) return true;
  if (node.name.toLowerCase().includes(needle)) return true;
  return node.children.some((child) => contains(child, needle));
}

function Branch({ node, depth, open, setOpen, base, needle, flat, onKey, onOpen }: { node: Node; depth: number; open: Record<number, boolean>; setOpen: (value: Record<number, boolean> | ((current: Record<number, boolean>) => Record<number, boolean>)) => void; base: string; needle: string; flat: Node[]; onKey: (event: React.KeyboardEvent<HTMLButtonElement>, node: Node, index: number) => void; onOpen: (node: Node) => void }) {
  const visible = contains(node, needle);
  if (!visible) return null;
  const index = flat.findIndex((item) => item.id === node.id);
  return (
    <div role="treeitem" aria-expanded={open[node.id] ? "true" : "false"} className="flex flex-wrap items-center" style={{ marginLeft: depth * 16 }}>
      <button type="button" className="rounded px-2 py-2 text-xs focus:outline focus:outline-2" aria-label={open[node.id] ? `Collapse ${node.name}` : `Expand ${node.name}`} onClick={() => setOpen((current) => ({ ...current, [node.id]: !current[node.id] }))}>{open[node.id] ? "−" : "+"}</button>
      <button id={`tree-${node.id}`} type="button" className="flex flex-1 items-center gap-3 rounded px-2 py-2 text-left text-sm focus:outline focus:outline-2" onClick={() => onOpen(node)} onKeyDown={(event) => onKey(event, node, index)}>
        <Initials name={node.name} />
        <span>{node.name}<span className="ml-2 text-xs text-muted-foreground">{node.job_title || "No designation"}</span></span>
        {node.overdue_tasks > 0 ? <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">Overdue {node.overdue_tasks}</span> : <span className="text-xs text-muted-foreground">No overdue tasks</span>}
        {node.also_reports_to_others ? <span className="text-xs text-muted-foreground">Also reports to others</span> : null}
      </button>
      {open[node.id] ? <div className="w-full">{node.children.map((child) => <Branch key={`${node.id}-${child.id}`} node={child} depth={depth + 1} open={open} setOpen={setOpen} base={base} needle={needle} flat={flat} onKey={onKey} onOpen={onOpen} />)}</div> : null}
    </div>
  );
}
