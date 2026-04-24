# 人生效率清单 · Life Efficiency

一款极简的效率追踪 Web App，基于 **135 原则**（1 个大任务 + 3 个中等任务 + 5 个小型任务），辅以 24 小时时间审计、精力曲线与四周/年度复盘。

数据全部保存在浏览器本地（IndexedDB），**零后端、零登录、零订阅**，可一键导出 JSON 备份。

---

## 快速开始

```bash
npm install
npm run dev           # 本地开发：http://localhost:3000
npm run build         # 生产构建（静态导出到 ./out）
```

构建完成后的 `./out` 是一个纯静态站点，可以丢到任何静态托管上。

---

## 部署到 lincifeng.com/efficiency 子路径

### 方式一：作为子目录嵌入现有站点

如果你的 `lincifeng.com` 是由一个根仓库生成的静态站（如 GitHub Pages、Cloudflare Pages），可以这样做：

```bash
BASE_PATH=/efficiency npm run build
# 然后把 out/ 里的内容，整个放到主站仓库的 efficiency/ 文件夹下
cp -r out/. /path/to/lincifeng.com/efficiency/
```

访问：`https://lincifeng.com/efficiency/`

### 方式二：独立子域名（推荐，更干净）

用 Vercel / Cloudflare Pages 单独托管这个仓库，并把域名绑为 `life.lincifeng.com`：

1. 把本项目推到 GitHub
2. 在 Vercel 新建项目 → 选中该仓库 → 一键部署（无需改配置）
3. 在 Vercel 项目设置中，把 `life.lincifeng.com` 加为自定义域
4. 回到你的域名 DNS 解析里，为 `life` 子域加一条 CNAME 指向 Vercel 给的地址

这种方式不需要设置 `BASE_PATH`。

### 方式三：直接用根域

同上用 Vercel 绑定 `lincifeng.com`，但前提是你愿意把整个主站换成这个项目。

---

## 目录结构

```
src/
├── app/
│   ├── layout.tsx         顶层布局 + 底部 TabBar
│   ├── page.tsx           今日清单（135 任务 + 时间格 + 预算）
│   ├── energy/page.tsx    24 小时精力曲线
│   ├── review/page.tsx    四周 / 年度复盘
│   └── settings/page.tsx  数据导入导出
├── components/            UI 组件
└── lib/
    ├── db.ts              Dexie 数据模型 + 导入导出
    └── hooks.ts           数据响应式 hooks
```

## 技术栈

- **Next.js 16**（App Router + 静态导出）
- **React 19** + **TypeScript**
- **Tailwind CSS v4** + 自定义纸感主题
- **Dexie.js**（IndexedDB 封装）
- **Recharts**（精力曲线图）

## 数据说明

所有数据存储在浏览器的 IndexedDB 里（数据库名 `life-efficiency`）。容量可达数百 MB，正常使用几十年都不会满。

**重要**：清除浏览器数据、更换设备、切换浏览器，数据不会自动同步。请定期到「设置 → 数据备份 → 导出 JSON」下载一份备份。

---

by **Felix Lin** · [lincifeng.com](https://lincifeng.com)
