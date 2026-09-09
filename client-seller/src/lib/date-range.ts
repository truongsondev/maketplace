export type DateRangeOption = "7d" | "30d" | "all" | "custom";

export type DateRangeValue = {
  option: DateRangeOption;
  from: string;
  to: string;
};

export type DateRangeResolved = {
  from?: string;
  to?: string;
  label: string;
  days: number;
};

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function computePresetRange(days: number): {
  from: string;
  to: string;
  days: number;
} {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));

  return {
    from: formatDateInput(start),
    to: formatDateInput(end),
    days,
  };
}

function getCustomDays(from?: string, to?: string): number {
  if (!from || !to) return 0;
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return 0;
  }
  const diff = toDate.getTime() - fromDate.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

export function resolveDateRange(value: DateRangeValue): DateRangeResolved {
  if (value.option === "7d") {
    const preset = computePresetRange(7);
    return {
      ...preset,
      label: "7 ngày gần đây",
    };
  }

  if (value.option === "30d") {
    const preset = computePresetRange(30);
    return {
      ...preset,
      label: "30 ngày gần đây",
    };
  }

  if (value.option === "all") {
    return {
      label: "Tất cả",
      days: 365,
    };
  }

  const days = getCustomDays(value.from, value.to);
  const label =
    value.from && value.to
      ? `Từ ${value.from} đến ${value.to}`
      : "Khoảng thời gian";

  return {
    from: value.from || undefined,
    to: value.to || undefined,
    days,
    label,
  };
}
