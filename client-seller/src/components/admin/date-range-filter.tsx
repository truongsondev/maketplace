import {
  resolveDateRange,
  type DateRangeOption,
  type DateRangeValue,
} from "@/lib/date-range";

const OPTIONS: Array<{ value: DateRangeOption; label: string }> = [
  { value: "7d", label: "7 ngày trước" },
  { value: "30d", label: "30 ngày trước" },
  { value: "all", label: "Tất cả" },
  { value: "custom", label: "Khoảng thời gian" },
];

type DateRangeFilterProps = {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  className?: string;
};

export function DateRangeFilter({
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  const resolved = resolveDateRange(value);

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className ?? ""}`.trim()}
    >
      <select
        value={value.option}
        onChange={(e) =>
          onChange({
            ...value,
            option: e.target.value as DateRangeOption,
          })
        }
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {value.option === "custom" ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            max={value.to || undefined}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
          />
          <span className="text-sm text-slate-500">—</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            min={value.from || undefined}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
          />
        </div>
      ) : null}

      <span className="text-xs text-slate-500">{resolved.label}</span>
    </div>
  );
}
