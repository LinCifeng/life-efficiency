"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/SectionLabel";

export default function AboutPage() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("life-efficiency:seen-about", "1");
    } catch {}
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-4">
      <header className="flex items-center justify-between pt-2">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          返回
        </Link>
        <span className="text-xs text-[color:var(--fg-soft)]">关于</span>
      </header>

      {/* 写在前面 */}
      <section className="space-y-4">
        <h1 className="text-2xl font-medium tracking-tight">写在前面</h1>
        <div className="space-y-4 text-[15px] leading-loose text-[color:var(--fg)]">
          <p>
            我们常常为时间而焦虑，每一天忙忙碌碌，填满了工作、家事、应酬、社交……可是，有没有问过自己，时间都花在
            <Underline>真正值得的事情</Underline>上了吗？
          </p>
          <p>
            我们有没有停下来反思过
            <Underline>自己的人生目标和价值观</Underline>？有没有在匆忙的生活中照顾好
            <Underline>自己</Underline>，花时间关心我们爱的人，并且留出空间滋养自己的心灵？
          </p>
          <p>
            <Underline>时间是一种有限的资源</Underline>，你投入到哪里，就会在哪里获得反馈和体验，
            <Underline>而想以自己喜欢的方式过一生</Underline>，就要用一种
            <Underline>更高效的时间利用方式</Underline>
            ，在工作、生活和个人志趣之间找到平衡。
          </p>
          <p>
            人生效率清单融合了多种时间和精力管理工具，不仅可以帮你将专注力锁定到真正重要的事情上，
            还可以让你遵从内心的真实声音，规划出每一天充满意义的行动蓝图。
          </p>
          <p>
            基于积极心理学的独特设计，让我们在追逐目标的同时，也不错过人生中那些重要时刻、
            与亲友相伴的美好时光，并深刻体会到生命的丰富与绚烂。
          </p>
        </div>
      </section>

      {/* 六步法 */}
      <section className="space-y-4">
        <SectionLabel>六步使用法</SectionLabel>
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const open = activeStep === i;
            return (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(open ? null : i)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-card)] p-4 text-left transition-colors hover:border-[color:var(--accent-soft)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--bg-tag-strong)] text-sm tabular-nums text-[color:var(--fg)]">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[color:var(--fg)]">
                      {step.title}
                    </div>
                    <div className="text-xs text-[color:var(--fg-muted)]">
                      {step.subtitle}
                    </div>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 text-[color:var(--fg-soft)] transition-transform ${open ? "rotate-90" : ""}`}
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </div>
                {open && (
                  <div className="mt-4 space-y-3 border-t border-[color:var(--border-soft)] pt-4 text-[13px] leading-relaxed text-[color:var(--fg-muted)]">
                    {step.body.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                    {step.tip && (
                      <div className="rounded-lg bg-[color:var(--border-soft)]/60 px-3 py-2 text-[12px] text-[color:var(--fg)]">
                        💡 {step.tip}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 135 原则 */}
      <section className="space-y-3">
        <SectionLabel>135 原则</SectionLabel>
        <div className="card space-y-3 text-sm leading-relaxed">
          <p className="text-[color:var(--fg)]">
            一种列出待办事项清单的高效方法，其核心是给当天设定：
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard n="1" label="大任务" note="当天最重要、最难、最耗时的事" />
            <StatCard n="3" label="中等任务" note="今天必须完成、需要一定精力的事" />
            <StatCard n="5" label="小型任务" note="短时间内可轻松完成的事" />
          </div>
          <p className="text-[13px] text-[color:var(--fg-muted)]">
            "我选择做" 这四个字，旨在增强你的执行主动性。当一件事是你主动选择去做、
            你决定去做的，不仅强化做事意愿，也提高自我效能感，你会更自觉、自信、自主地执行。
          </p>
        </div>
      </section>

      <div className="pt-2">
        <Link
          href="/"
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          开始使用
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function Underline({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-b border-[color:var(--accent-soft)] pb-0.5">
      {children}
    </span>
  );
}

function StatCard({
  n,
  label,
  note,
}: {
  n: string;
  label: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-card)] p-3 text-center">
      <div className="text-2xl font-medium tabular-nums text-[color:var(--accent)]">
        {n}
      </div>
      <div className="mt-0.5 text-xs font-medium text-[color:var(--fg)]">
        {label}
      </div>
      <div className="mt-1 text-[10px] leading-tight text-[color:var(--fg-soft)]">
        {note}
      </div>
    </div>
  );
}

const STEPS: Array<{
  title: string;
  subtitle: string;
  body: string[];
  tip?: string;
}> = [
  {
    title: "重新认识自己的时间",
    subtitle: "5 天时间审计，统计每日实际可支配时长",
    body: [
      "每天起床后，以半小时为单位，记录自己的时间使用情况，并标上对应的符号（个人 ☆ / 工作 ○ / 家人朋友 △ / 不可支配 ·）。",
      "持续记录五天，来观察自己的时间使用状况。只有掌握了这个预算情况，你才知道一天的可用时间上限，以及哪些事情必须优先安排。",
    ],
    tip: "这份审计表会让你重新审视：在个人、工作、家人/朋友这三个维度，你有没有分别投入足够的时间和关注？",
  },
  {
    title: "重新认识自己的精力",
    subtitle: "24 小时精力打分，画出自己的精力曲线",
    body: [
      "每天起床后，以 1 小时为单位，用 1–10 分为自己打分（1 最差，10 最佳）。例如早上 9 点感觉精力不错，就给 8 分。",
      "连续记录 5 天，即可观察出自己的精力起伏规律。有的人属于「早起型」，有的属于「夜猫型」，更多的人居于两者之间。",
    ],
    tip: "把重要、有难度的事，安排在精力旺盛时间，事半功倍；低精力时间则安排不费脑的、难度较小的事。",
  },
  {
    title: "调整自己的时间精力支出",
    subtitle: "根据审计结果，写下期望分配",
    body: [
      "完成 5 天记录后，在「时间审计分析」栏，根据你的直觉，写下每天分配在个人/工作/家人朋友的期望百分比。",
      "然后在「时间使用期望」栏，写下你对于时间的理想分配比例。",
      "反思：上面的时间是否合理？有没有「自以为投入了很多时间，但事实却相反」的情况？是否需要调整？",
    ],
    tip: "「黄金比例」一说是三分之一给工作，三分之一给自己，三分之一给家人朋友——但你也可以自己选择，为自己的生活做出规划。",
  },
  {
    title: "每日执行高效清单",
    subtitle: "按 135 原则列出今日清单",
    body: [
      "在每天的开始，预估这一整天的「时间总预算」，分配好在「个人」「工作」和「家人/朋友」上的比例。",
      "然后按照「135 原则」写下今天的待办事项清单：1 个大任务 + 3 个中等任务 + 5 个小型任务。",
      "当你计算出当天的时间预算、参考自己的精力曲线，就会更实地安排当天的事务，不至于过分乐观或贪心，避免时间浪费或低效使用。",
    ],
    tip: "通过事先设定这些不同难度的任务，你更有效地利用时间，并且在一天里交替完成大小任务，也有助于保持做事的灵活性和弹性。",
  },
  {
    title: "每 4 周进行一次复盘",
    subtitle: "阶段性反思，持续优化",
    body: [
      "根据页面上的提示问题，复盘自己在个人、工作、家人/朋友这三个维度的时间投入及反馈。",
      "审视这一个月内，自己的时间投入是否符合预期，有哪些因素造成了阻碍？需要做哪些优化或调整？",
      "并思考在这段时间里，这三个维度的时间安排，是否给自己带来了积极的变化？在个人成长、工作效率、亲密关系方面，是否比以前有更好的体验和更值得回味的时刻？",
    ],
  },
  {
    title: "年度大总结",
    subtitle: "盘点全年成长，写下愿望清单",
    body: [
      "根据提示问题，盘点过去一年的成长与收获，为下一年做好心理准备。",
      "个人方面：掌握了哪些重要技能？有哪些成长？兴趣与激情是否花了足够时间去追求？",
      "工作方面：遇到了哪些挑战？做出了哪些重要决策？带来了哪些积极影响？",
      "家人朋友方面：有哪些快乐时刻值得回忆？对亲密关系产生了哪些积极影响？",
    ],
    tip: "PS · 愿望清单：认真写下每一个愿望，并适时安排在每日清单里。愿望只有通过行动，才会化为现实。写得越具体越好——看似微小的目标，更容易执行并带来实际的改变。",
  },
];
