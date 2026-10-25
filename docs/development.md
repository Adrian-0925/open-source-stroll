# 开发

```bash
npm ci
npm run build
npm run check
npm test
```

- `public/`：原生 HTML、CSS、JavaScript；前端无需框架或 CDN 脚本。
- `public/my-projects.js`：作者公开项目与个人 Fork 的展示资料，独立于每日推荐数据；新增项目时核对用途、许可证与上游来源。
- `worker/index.mjs`：缓存 API、每日筛选、去重和中文简介写入。
- `public/update-cloud.mjs`：独立更新程序，只把公开项目简介发送给翻译服务。
- `db/`、`drizzle/`：数据库结构与已生成的 SQL 迁移。
- `scripts/`：构建、本地 SQLite 适配和手动更新。
- `tests/`：日期、幂等、限流回退、批次校验、翻译缓存与鉴权测试。

构建将页面资源嵌入 `dist/server/index.js`；`dist/` 为生成目录，不提交。数据库改动应编辑 `db/schema.ts`，运行 `npm run db:generate`，审核并提交 `drizzle/` 里的迁移。

页面保持连续项目流、浅色底色、清晰对比度和易读正文。优先让用途、使用门槛和项目来源容易理解；主导航包括今日精选、往日推荐、我的收藏和我做的项目。手机端使用四列导航，作品页可通过 `#projects` 直达；关于窗口也保留入口。

更新按 America/Denver 日历生成新一期。每小时刷新最新一期与首期项目；旧期项目保留各自的 `checkedAt`，并非全量实时。错过的日期不会补造期刊。筛选依赖主题、许可证、近期活跃和 Star 等规则，不等于人工实测推荐。

截图来自项目自身界面；花形标识及 CSS/SVG 用途示意为本站绘制，头像加载失败会回退为文字缩写。
