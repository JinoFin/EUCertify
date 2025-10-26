# EUCertify

EUCertify 是一个基于 Next.js 14 的渐进式 Web 应用（PWA），帮助制造商、进口商和欧盟授权代表生成欧盟合规文件、知识条目和多语言 PDF。

## 功能概览
- ⚙️ **一步一步的合规模块**：单页问题向导，离线草稿自动保存，实时规则引擎基于 json-logic 计算适用法规与建议标准。
- 📚 **知识中心**：LVD、EMC、RED、RoHS、WEEE、Battery、GPSR、Toys、PPE、MDR 等法规的多语言 MDX 内容，带责任清单与 EUR-Lex 链接。
- 🗂 **多租户产品管理**：示例仪表盘展示产品、合规状态与文档入口。
- 🧾 **专业 PDF 模板**：DoC、技术文件清单、标签模板支持德语/英语/简体中文，含 QR 验证链接、法规引用与 SVG 图标。
- 🔐 **Supabase 准备**：SQL 架构、RLS 策略与种子脚本，方便连接 Postgres/Supabase。
- 📦 **PWA 支持**：Workbox Service Worker、缓存知识页面与向导草稿，manifest.webmanifest。
- ✅ **自动化测试**：Vitest（规则引擎场景）与 Playwright（端到端向导案例）配置。
- 🚀 **CI/CD**：GitHub Actions 运行 lint、typecheck、unit、e2e、build。

## 快速开始
```bash
npm install
npm run dev
```
访问 <http://localhost:3000>。

### 环境变量
将 Supabase 相关变量写入 `.env.local`：
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 项目结构
- `app/`：App Router 页面与 API（向导、仪表盘、PDF、QR、知识页面等）
- `components/`：UI 组件（Button、Card、LanguageSwitch、DocPreview、KnowledgePanel 等）
- `lib/`：通用库（i18n、supabase、pwa、pdf、qr、mermaid 预留）
- `rules/`：法规元数据、逻辑规则、标准映射 JSON
- `knowledge/`：多语言 MDX 知识条目
- `templates/`：PDF HTML 模板与打印样式
- `db/`：数据库 schema、RLS 策略和示例种子
- `e2e/`：Playwright 测试用例
- `public/`：PWA manifest、Service Worker、SVG 图标

## 开发脚本
- `npm run dev`：开发服务器
- `npm run lint`：ESLint
- `npm run typecheck`：TypeScript 校验
- `npm run test`：Vitest 单元测试
- `npm run e2e`：Playwright 端到端测试
- `npm run build`：生产构建

## 测试场景
Vitest 聚焦规则引擎输出；Playwright 覆盖两类产品流程：
- 蓝牙音箱：触发 RED、RoHS、WEEE、Battery、GPSR
- 市电灯具：触发 LVD、EMC、RoHS、WEEE、GPSR

## 部署提示
- 生产部署前配置 Supabase 凭据并运行 `db/schema.sql` 和 `db/policies.sql`
- `app/api/pdf` 使用 Puppeteer 渲染，需要无头 Chromium 运行环境（建议开启 `--no-sandbox` 容器）
- PWA 需要 HTTPS 与 `serviceWorker` 支持

## 测试结果与部署链接
- **最新单元测试**：`npm test`（Vitest）于 2025-10-26 00:39 UTC 执行，2 个测试全部通过：

  ```text
  Test Files  1 passed (1)
       Tests  2 passed (2)
  ```

- **Vercel 线上地址**：<https://eucertify.vercel.app>

## 许可
MIT
