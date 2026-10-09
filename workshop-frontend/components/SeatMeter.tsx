interface SeatMeterProps {
  available: number;
  capacity: number;
}

export default function SeatMeter({ available, capacity }: SeatMeterProps) {
  const used = capacity - available;
  const pct = capacity > 0 ? (used / capacity) * 100 : 100;
  const color =
    pct >= 100
      ? "bg-red-500"
      : pct >= 80
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">
          {available === 0 ? (
            <span className="text-danger font-semibold">Fully booked</span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{available}</span>{" "}
              of {capacity} seats left
            </>
          )}
        </span>
      </div>
      <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
