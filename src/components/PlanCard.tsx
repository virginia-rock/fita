type PlanCardProps = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  actionLabel: string;
  onAction: () => void;
  featured?: boolean;
};

export function PlanCard({
  name,
  price,
  cadence,
  description,
  features,
  actionLabel,
  onAction,
  featured = false,
}: PlanCardProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-sm p-6 ring-1 ${
        featured ? "bg-clay text-paper ring-clay" : "bg-vellum/50 text-ink ring-ink/10"
      }`}
    >
      <div className={`label-caps ${featured ? "text-paper/70" : "text-clay"}`}>{name}</div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="num text-4xl font-medium tracking-normal">{price}</span>
        <span className={`text-xs ${featured ? "text-paper/65" : "text-ink/50"}`}>{cadence}</span>
      </div>
      <p className={`mt-4 min-h-12 text-sm leading-relaxed ${featured ? "text-paper/80" : "text-ink/65"}`}>
        {description}
      </p>
      <ul className={`mt-6 flex-1 space-y-3 text-sm ${featured ? "text-paper/85" : "text-ink/70"}`}>
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-current" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAction}
        className={`mt-8 w-full rounded-sm px-4 py-3 text-xs font-medium uppercase tracking-widest transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          featured
            ? "bg-paper text-ink focus-visible:ring-paper focus-visible:ring-offset-clay"
            : "bg-clay text-paper focus-visible:ring-clay focus-visible:ring-offset-paper"
        }`}
      >
        {actionLabel}
      </button>
    </article>
  );
}
