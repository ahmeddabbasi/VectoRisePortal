type Props = {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, action }: Props) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
      <div>
        {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
