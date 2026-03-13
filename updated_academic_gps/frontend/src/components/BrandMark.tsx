import brandLogo from "../../image.png";

type Props = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: Props) {
  const sizeClass = compact ? "h-12 w-[92px] rounded-2xl" : "h-24 w-[180px] rounded-[24px]";

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-white/35 bg-[linear-gradient(145deg,rgba(255,248,238,0.94),rgba(232,211,189,0.78))] shadow-[0_18px_48px_rgba(111,88,67,0.22)] ${sizeClass}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.7),transparent_34%),radial-gradient(circle_at_72%_78%,rgba(214,176,148,0.22),transparent_40%)]" />
      <img src={brandLogo} alt="Brand logo" className="relative z-10 h-full w-full object-contain p-1.5" />
    </div>
  );
}
