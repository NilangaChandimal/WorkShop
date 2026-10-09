interface SeatMeterProps {
  available: number;
  capacity: number;
}

export default function SeatMeter({ available, capacity }: SeatMeterProps) {
  const used = capacity - available;
  const pct = capacity > 0 ? (used / capacity) * 100 : 100;
  const color =
    pct >= 100
      ? "bg-rose-500"
      : pct >= 80
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 font-medium">
          {available === 0 ? (
            <span className="text-rose-600 font-semibold">Fully booked</span>
          ) : (
            <>
              <span className="font-semibold text-slate-800">{available}</span>{" "}
              of {capacity} seats left
            </>
          )}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
