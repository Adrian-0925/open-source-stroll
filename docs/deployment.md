# 部署与自动更新

本仓库不包含维护者的部署标识、生产数据、令牌或私有平台连接。网页样式与原版本保持一致；公开版本另外为后台写入增加独立令牌校验，默认禁止匿名写入。

## Cloudflare Workers + D1

1. 安装依赖并构建：`npm ci`、`npm run build`。
2. 使用官方 Wrangler 登录你的 Cloudflare 账号，创建数据库：`npx wrangler d1 create open-source-stroll`。
3. 将 `wrangler.example.jsonc` 复制为 `wrangler.jsonc`，填入返回的数据库 ID。这个文件已被忽略，不提交真实部署配置。
4. 执行迁移：`npx wrangler d1 migrations apply DB --remote`。
5. 用密码管理器生成至少 32 位随机令牌，通过 `npx wrangler secret put UPDATE_TOKEN` 设置，避免令牌进入命令参数或文件。
6. 执行 `npx wrangler deploy`，记下你的 HTTPS 网站 origin。`GITHUB_TOKEN` 为可选服务端 Secret，可提高 GitHub API 可用额度。

Worker 输出是 `dist/server/index.js`，D1 绑定名为 `DB`。HTTP 后台入口要求 `Authorization: Bearer <UPDATE_TOKEN>`；未设置令牌时禁用后台写入。页面和快照读取无需该令牌。

以上是自托管配置说明。核心构建、数据库逻辑和写入鉴权有本地测试；具体 Cloudflare 账号的首次部署需要在你自己的环境验证。

## 每小时更新

仓库包含可选的 **Update project data** 工作流，默认不运行。部署后在 GitHub 仓库 Settings → Secrets and variables → Actions 配置：

- Variable `SITE_ORIGIN`：你的 HTTPS 网站 origin，不含尾部斜杠或路径。
- Secret `SITE_UPDATE_TOKEN`：与 Worker 中 `UPDATE_TOKEN` 相同的值。

先在 Actions 页手动运行一次，核对更新日志与 `/api/feed` 的成功时间，再启用/使用定时调度。计划为每小时第 17 分钟；GitHub 调度可能延迟。每日新一期日期使用 America/Denver。

更新脚本先从 `/api/admin/plan` 取计划，从 GitHub 官方 API 收集完整批次，再写入 `/api/admin/ingest`。随后处理中文简介队列并读回验证。常规更新只写数据，不重新部署网页。

GitHub 匿名接口、Actions Token 和 MyMemory 均有使用限制。脚本遇到限流保留上次完整内容；机器翻译失败保留已有中文并重试。MyMemory 只接收公开仓库简介，不接收后台令牌。原文已是中文时不调用翻译。

## 静态预览

`npm run build` 后的 `dist/index.html` 可用于静态预览。静态托管没有 D1 或后台写入能力，因此只显示初始推荐；浏览器本机收藏仍可使用。不要把静态预览称为持续自动更新的完整部署。

## 资料

- [Workers 部署](https://developers.cloudflare.com/workers/wrangler/commands/#deploy)
- [D1 迁移](https://developers.cloudflare.com/d1/reference/migrations/)
- [GitHub 调度](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [MyMemory API](https://mymemory.translated.net/doc/spec.php) · [使用额度](https://mymemory.translated.net/doc/usagelimits.php)
