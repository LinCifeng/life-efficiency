# 部署到腾讯云 EdgeOne Pages

> 一次配置，终身自动部署。以后 `git push` 就等于发布。

## 当前状态

✅ GitHub CLI 已安装并登录
✅ 两个私有仓库已创建并推送：
- 主站：<https://github.com/LinCifeng/lincifeng.com>
- 效率清单：<https://github.com/LinCifeng/life-efficiency>

接下来只需要在 EdgeOne Pages 控制台点几下。

---

## 一、把现有主站 lincifengcom 改为 Git 自动部署

这样以后主站也能 `git push` 自动上线，不用再手工打包。

1. 打开 <https://console.cloud.tencent.com/edgeone/pages>
2. 点开项目 **lincifengcom** → 右上角点 **关联 Git**
3. 选 **GitHub** → 授权 EdgeOne 访问你的 GitHub（首次会跳到 GitHub 授权页）
   - 授权时可以选"只授权这个仓库"，更安全
   - 选择仓库 `LinCifeng/lincifeng.com`
4. **构建设置**（很关键，别填错）：
   - **框架预设**：`None / 静态 HTML`
   - **构建命令**：留空
   - **输出目录**：`./`（就是仓库根目录）
   - **生产分支**：`main`
5. 点保存 → 会自动触发第一次构建部署
6. 几分钟后访问 <https://lincifeng.com> 验证和原来一样

**以后迭代主站的流程**：

```bash
cd "/Users/lincifeng/Documents/👨🏻‍💻个人/个人材料/26.1.4个人网站/PersonalPageProject"
# 改文件……
git add -A
git commit -m "更新某某页面"
git push
# 一两分钟后 lincifeng.com 自动更新
```

---

## 二、为效率清单创建新的 EdgeOne Pages 项目

1. 回到 <https://console.cloud.tencent.com/edgeone/pages>
2. 点 **创建项目** → **从 Git 导入**
3. 选择仓库 `LinCifeng/life-efficiency`
4. **构建设置**：
   - **框架预设**：选 **Next.js**（EdgeOne 会自动识别）
     - 如果没有这个选项，选 "其他" 然后手填下面参数
   - **构建命令**：`npm run build`
   - **输出目录**：`out`
   - **Node 版本**：`20` 或 `22`（都可以）
   - **生产分支**：`main`
5. 点创建 → 等第一次构建（大约 2–4 分钟）
6. 构建完成后 EdgeOne 会给你一个临时域名，如 `xxx.pages.edgeone.com`，点开确认页面能用

### 绑定自定义域名 focus.lincifeng.com

7. 在这个新项目里，点 **域名管理** → **添加域名**
8. 输入：`focus.lincifeng.com`
9. EdgeOne 会提示你加一条 DNS 解析
   - 如果你的 `lincifeng.com` 域名**已经托管在腾讯云 DNSPod**：一键自动配置，不用手动加
   - 如果在别的 DNS 服务商：按提示在那边加一条 CNAME 指向 EdgeOne 给的地址
10. 等 HTTPS 证书签发（自动，1–5 分钟）
11. 访问 <https://focus.lincifeng.com>，看到效率清单就成功了

---

## 三、日常迭代流程

**效率清单想改点东西：**

```bash
cd /Users/lincifeng/Documents/👨🏻‍💻个人/AIchat/life-efficiency

# 本地预览（改的过程中实时看效果）
npm run dev
# 打开 http://localhost:3000

# 改满意了，提交发布
git add -A
git commit -m "调整某某功能"
git push
# EdgeOne 自动构建 → 2–4 分钟后 focus.lincifeng.com 更新
```

**需要回滚某次改动：**
在 EdgeOne Pages 项目 → **构建部署** 列表 → 找到想回到的那个版本 → 点"回滚"

---

## 四、可能的坑 & 对策

| 问题 | 解决 |
|---|---|
| 构建失败，Node 版本不对 | 在项目设置 → 环境变量加 `NODE_VERSION=22` |
| 构建超时 | EdgeOne 免费版构建时长有限，一般不会超，超了再反馈 |
| 域名绑不上 | 确认 DNS 解析已生效：`dig focus.lincifeng.com` 看结果 |
| 用 IndexedDB 的数据跨子域会丢 | ✓ 已确认独立子域，效率清单数据只存在 focus.lincifeng.com 下，不会和主站混 |
| 想本地测试生产构建 | `npm run build && npx serve out` |

---

## 五、后续增强（可选）

1. **PWA**：加 manifest + service worker，效率清单可以装到 iPhone 主屏当 App 用
2. **自动版本号**：在 footer 显示 git commit hash，方便排查
3. **Preview 环境**：给 `develop` 分支也配一个子域（如 `dev.focus.lincifeng.com`）作为测试环境
4. **访问统计**：EdgeOne 自带访问分析，免费版就够看

有需要任何一条，告诉我继续做。
