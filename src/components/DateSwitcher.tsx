"use client";

import { addDays, formatDate, parseDate } from "@/lib/db";
import clsx from "clsx";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export function DateSwitcher({
  date,
  onChange,
}: {
  date: string;
  onChange: (date: string) => void;
}) {
  const d = parseDate(date);
  const today = formatDate(new Date());
  const isToday = date === today;
  const weekday = WEEK[d.getDay()];

  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <div className="text-5xl font-medium tracking-tight text-[color:var(--fg)] sm:text-6xl">
          {d.getMonth() + 1}
          <span className="text-[color:var(--fg-soft)]">/</span>
          {d.getDate()}
        </div>
        <div className="flex flex-col leading-tight text-[color:var(--fg-muted)]">
          <span className="text-base font-medium text-[color:var(--fg)]">
            周{weekday}
          </span>
          <span className="text-xs tracking-wider">{d.getFullYear()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 pb-1">
        <IconButton onClick={() => onChange(addDays(date, -1))} aria-label="前一天">
          <Chevron dir="left" />
        </IconButton>
        <button
          type="button"
          onClick={() => onChange(today)}
          className={clsx(
            "rounded-full px-3.5 py-1.5 text-sm tracking-wide transition-colors",
            isToday
              ? "bg-[color:var(--bg-tag-strong)] text-[color:var(--fg)]"
              : "text-[color:var(--fg-muted)] hover:bg-[color:var(--border-soft)]",
          )}
        >
          今天
        </button>
        <IconButton onClick={() => onChange(addDays(date, 1))} aria-label="后一天">
          <Chevron dir="right" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--fg-muted)] transition-colors hover:bg-[color:var(--border-soft)]"
    >
      {children}
    </button>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: dir === "right" ? "rotate(180deg)" : undefined }}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
