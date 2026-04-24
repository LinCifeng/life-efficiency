"use client";

import clsx from "clsx";

// 点阵录入：24 列（小时）× 10 行（分数）。点击某格即填入该小时的分数；再次点击清空。
export function EnergyGrid({
  scores,
  onChange,
}: {
  scores: Array<number | null>;
  onChange: (scores: Array<number | null>) => void;
}) {
  function setScore(hour: number, score: number) {
    const next = [...scores];
    next[hour] = scores[hour] === score ? null : score;
    onChange(next);
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* 分数行 10 -> 1，从上到下 */}
        <div className="flex flex-col gap-[2px]">
          {Array.from({ length: 10 }, (_, i) => 10 - i).map((score) => (
            <div key={score} className="flex items-center gap-1">
              <div className="w-5 text-right text-[10px] tabular-nums text-[color:var(--fg-soft)]">
                {score}
              </div>
              <div className="grid flex-1 grid-cols-[repeat(24,minmax(0,1fr))] gap-[2px]">
                {Array.from({ length: 24 }, (_, h) => {
                  const active = scores[h] === score;
                  const filled = scores[h] != null && scores[h]! >= score;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setScore(h, score)}
                      aria-label={`${h}:00 ${score}分`}
                      className={clsx(
                        "aspect-square rounded-[3px] border transition-colors",
                        active
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)]"
                          : filled
                            ? "border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)]/60"
                            : "border-[color:var(--border)] hover:bg-[color:var(--border-soft)]",
                      )}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {/* 时间轴 */}
        <div className="mt-2 flex items-center gap-1">
          <div className="w-5" />
          <div className="grid flex-1 grid-cols-[repeat(24,minmax(0,1fr))] gap-[2px] text-[9px] tabular-nums text-[color:var(--fg-soft)]">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
