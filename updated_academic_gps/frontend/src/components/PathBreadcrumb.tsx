type Props = {
  items: string[];
};

export function PathBreadcrumb({ items }: Props) {
  return (
    <div className="flex min-h-10 items-center gap-2 overflow-hidden rounded-full border border-ficus-cream/10 bg-ficus-forest/20 px-4">
      <span className="text-[11px] uppercase tracking-[0.28em] text-ficus-lilac">Path</span>
      <div className="truncate text-sm text-ficus-cream">{items.join(" / ")}</div>
    </div>
  );
}
