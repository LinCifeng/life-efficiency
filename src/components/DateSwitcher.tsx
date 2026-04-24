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
    <div className="flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-medium tracking-tight text-[color:var(--fg)]">
          {d.getMonth() + 1}
          <span className="text-[color:var(--fg-soft)]">/</span>
          {d.getDate()}
        </div>
        <div className="text-sm text-[color:var(--fg-muted)]">
          周{weekday} · {d.getFullYear()}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconButton onClick={() => onChange(addDays(date, -1))} aria-label="前一天">
          <Chevron dir="left" />
        </IconButton>
        <button
          type="button"
          onClick={() => onChange(today)}
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs tracking-wide transition-colors",
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
      className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--fg-muted)] transition-colors hover:bg-[color:var(--border-soft)]"
    >
      {children}
    </button>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
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
