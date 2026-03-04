import { useMemo, useState } from "react";

interface DatePickerProps {
  value?: Date | null;
  onChange?: (value: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface CalendarCell {
  key: string;
  label: number;
  date: Date;
  inCurrentMonth: boolean;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const initial = value ?? new Date();
  const [month, setMonth] = useState(initial.getMonth());
  const [year, setYear] = useState(initial.getFullYear());

  const selected = value ?? null;

  const cells: CalendarCell[] = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const result: CalendarCell[] = [];

    // Previous month spill
    for (let i = startDay - 1; i >= 0; i -= 1) {
      const day = daysInPrev - i;
      const date = new Date(year, month - 1, day);
      result.push({
        key: `prev-${day}`,
        label: day,
        date,
        inCurrentMonth: false,
      });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      result.push({
        key: `curr-${day}`,
        label: day,
        date,
        inCurrentMonth: true,
      });
    }

    // Next month spill to fill grid
    const total = startDay + daysInMonth;
    const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= remaining; i += 1) {
      const date = new Date(year, month + 1, i);
      result.push({
        key: `next-${i}`,
        label: i,
        date,
        inCurrentMonth: false,
      });
    }

    return result;
  }, [month, year]);

  const today = new Date();

  const formatDisplay = (date: Date | null): string => {
    if (!date) return placeholder;
    const month = MONTHS[date.getMonth()];
    return `${month ? month.slice(0, 3) : ""} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleSelect = (date: Date) => {
    onChange?.(date);
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.(null);
    setOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    setMonth(now.getMonth());
    setYear(now.getFullYear());
    onChange?.(now);
    setOpen(false);
  };

  const display = formatDisplay(selected);
  const isPlaceholder = !selected;

  const goMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  };

  return (
    <div className={["datepicker-wrap", className || null].filter(Boolean).join(" ")}>
      <button
        type="button"
        className={["datepicker-trigger", open ? "open" : null].filter(Boolean).join(" ")}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg
          className="dt-icon"
          viewBox="0 0 13 13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          aria-hidden="true"
        >
          <rect x="1" y="2" width="11" height="10" rx="1" />
          <line x1="1" y1="5" x2="12" y2="5" />
          <line x1="4" y1="1" x2="4" y2="3" />
          <line x1="9" y1="1" x2="9" y2="3" />
        </svg>
        <span className={isPlaceholder ? "dt-placeholder" : undefined}>{display}</span>
      </button>

      <div className={["datepicker-panel", open ? "open" : null].filter(Boolean).join(" ")}>
        <div className="dp-header">
          <button
            type="button"
            className="dp-nav-btn"
            onClick={() => goMonth(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="dp-month-label">
            {MONTHS[month]} {year}
          </span>
          <button
            type="button"
            className="dp-nav-btn"
            onClick={() => goMonth(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="dp-weekdays">
          <div className="dp-weekday">Su</div>
          <div className="dp-weekday">Mo</div>
          <div className="dp-weekday">Tu</div>
          <div className="dp-weekday">We</div>
          <div className="dp-weekday">Th</div>
          <div className="dp-weekday">Fr</div>
          <div className="dp-weekday">Sa</div>
        </div>

        <div className="dp-days">
          {cells.map((cell) => {
            const isToday =
              today.getFullYear() === cell.date.getFullYear() &&
              today.getMonth() === cell.date.getMonth() &&
              today.getDate() === cell.date.getDate();
            const isSelected =
              selected &&
              selected.getFullYear() === cell.date.getFullYear() &&
              selected.getMonth() === cell.date.getMonth() &&
              selected.getDate() === cell.date.getDate();

            const classes = ["dp-day"];
            if (!cell.inCurrentMonth) classes.push("other-month");
            if (isToday) classes.push("today");
            if (isSelected) classes.push("selected");

            return (
              <button
                key={cell.key}
                type="button"
                className={classes.join(" ")}
                onClick={() => handleSelect(cell.date)}
              >
                {cell.label}
              </button>
            );
          })}
        </div>

        <div className="dp-footer">
          <button type="button" className="btn btn-sm btn-ghost" onClick={handleToday}>
            Today
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

