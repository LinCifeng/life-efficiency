"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "今日", icon: CheckIcon },
  { href: "/energy", label: "精力", icon: WaveIcon },
  { href: "/review", label: "复盘", icon: BookIcon },
  { href: "/settings", label: "设置", icon: GearIcon },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--border)] bg-[color:var(--bg)]/85 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex w-full max-w-[960px] items-stretch justify-around px-2 py-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs transition-colors",
                active
                  ? "text-[color:var(--accent)]"
                  : "text-[color:var(--fg-soft)] hover:text-[color:var(--fg-muted)]",
              )}
            >
              <Icon active={active} />
              <span className="tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M8 12.5l2.8 2.8L16.5 9" />
    </svg>
  );
}

function WaveIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 14c2 0 3-6 5-6s3 10 5 10 3-12 5-12 3 6 5 6" />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5" />
      <path d="M19 18.5H6.5A2.5 2.5 0 0 0 4 21V5.5" />
      <path d="M8 7.5h7M8 11h5" />
    </svg>
  );
}

function GearIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.6a7.6 7.6 0 0 0 0-3.2l1.8-1.4-1.8-3.1-2.2.6a7.6 7.6 0 0 0-2.8-1.6L14 2.5h-4l-.4 2.3a7.6 7.6 0 0 0-2.8 1.6l-2.2-.6-1.8 3.1 1.8 1.4a7.6 7.6 0 0 0 0 3.2L2.8 14.9l1.8 3.1 2.2-.6a7.6 7.6 0 0 0 2.8 1.6l.4 2.3h4l.4-2.3a7.6 7.6 0 0 0 2.8-1.6l2.2.6 1.8-3.1-1.8-1.3Z" />
    </svg>
  );
}
