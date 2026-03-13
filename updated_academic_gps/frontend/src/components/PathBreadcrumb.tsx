type Props = {
  items: string[];
};

export function PathBreadcrumb({ items }: Props) {
  return (
    <div className="flex min-h-10 items-center gap-2 overflow-hidden rounded-full border border-white/8 bg-white/[0.04] px-4">
      <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Path</span>
      <div className="truncate text-sm text-slate-200">{items.join(" / ")}</div>
    </div>
  );
}
