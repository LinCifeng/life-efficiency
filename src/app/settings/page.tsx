"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { exportAll, importAll, db, type ExportPayload } from "@/lib/db";
import { SectionLabel } from "@/components/SectionLabel";

export default function SettingsPage() {
  const [status, setStatus] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const payload = await exportAll();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `life-efficiency-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`已导出 ${payload.daily.length} 天 · ${payload.energy.length} 条精力 · ${payload.reflections.length} 条复盘`);
  }

  async function handleImport(mode: "merge" | "replace") {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus("请先选择 JSON 文件");
      return;
    }
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as ExportPayload;
      await importAll(payload, mode);
      setStatus(`已${mode === "replace" ? "覆盖" : "合并"}导入`);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setStatus(`导入失败：${(e as Error).message}`);
    }
  }

  async function handleClear() {
    if (!confirm("将删除全部本地数据，无法恢复。确定继续？")) return;
    await db.daily.clear();
    await db.energy.clear();
    await db.reflections.clear();
    setStatus("已清空本地数据");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium tracking-tight">设置</h1>

      <section className="space-y-3">
        <SectionLabel>使用说明</SectionLabel>
        <Link
          href="/about"
          className="card flex items-center justify-between gap-3 transition-colors hover:border-[color:var(--accent-soft)]"
        >
          <div>
            <div className="text-sm text-[color:var(--fg)]">
              写在前面 · 六步使用法 · 135 原则
            </div>
            <div className="mt-0.5 text-[11px] text-[color:var(--fg-soft)]">
              为什么要做效率清单，以及如何一步步用它规划人生。
            </div>
          </div>
          <span className="text-[color:var(--fg-soft)]">→</span>
        </Link>
      </section>

      <section className="space-y-3">
        <SectionLabel>数据备份</SectionLabel>
        <div className="card space-y-4">
          <div>
            <div className="mb-1 text-sm">导出</div>
            <p className="mb-2 text-[11px] leading-relaxed text-[color:var(--fg-soft)]">
              所有数据会存成一个 JSON 文件下载到本地。建议定期导出作为备份，或在换设备时同步。
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="btn-primary text-sm"
            >
              导出 JSON 备份
            </button>
          </div>

          <div className="divider" />

          <div>
            <div className="mb-1 text-sm">导入</div>
            <p className="mb-2 text-[11px] leading-relaxed text-[color:var(--fg-soft)]">
              选择之前导出的 JSON 文件。"合并"会补充缺失数据，"覆盖"会清空当前数据再导入。
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="mb-2 block w-full text-xs text-[color:var(--fg-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--border-soft)] file:px-3 file:py-1.5 file:text-xs file:text-[color:var(--fg)] hover:file:bg-[color:var(--bg-tag-strong)]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleImport("merge")}
                className="btn-primary text-sm"
              >
                合并导入
              </button>
              <button
                type="button"
                onClick={() => handleImport("replace")}
                className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--fg-muted)] hover:bg-[color:var(--border-soft)]"
              >
                覆盖导入
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>危险区</SectionLabel>
        <div className="card">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-[color:var(--danger)] px-4 py-2 text-sm text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10"
          >
            清空所有本地数据
          </button>
        </div>
      </section>

      {status && (
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-card)] px-3 py-2 text-xs text-[color:var(--fg-muted)]">
          {status}
        </div>
      )}

      <section className="space-y-3">
        <SectionLabel>关于</SectionLabel>
        <div className="card space-y-2 text-[12px] leading-relaxed text-[color:var(--fg-muted)]">
          <p>
            人生效率清单 · 基于 <strong className="text-[color:var(--fg)]">135 原则</strong>
            （1 个大任务 + 3 个中等 + 5 个小型），辅以时间审计与精力曲线。
          </p>
          <p>
            所有数据仅保存在你当前浏览器（IndexedDB），不会上传任何服务器。
            清除浏览器数据或更换设备前，请先导出备份。
          </p>
          <p className="text-[color:var(--fg-soft)]">
            by Felix · lincifeng.com
          </p>
        </div>
      </section>
    </div>
  );
}
