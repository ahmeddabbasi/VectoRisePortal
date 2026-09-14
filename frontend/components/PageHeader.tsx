type Props = {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, accent, description, action }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">
          {title}
          {accent ? (
            <>
              {" "}
              <span className="font-display italic text-lavender">{accent}</span>
            </>
          ) : null}
        </h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 pb-1">{action}</div> : null}
    </header>
  );
}
