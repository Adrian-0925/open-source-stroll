# 开源散步 · Open Source Stroll

每天一小份，发现用得上的开源好工具。

[在线体验](https://open-source-stroll.tealbuddy129.chatgpt.site) · [我做的项目](https://open-source-stroll.tealbuddy129.chatgpt.site/#projects) · [GitHub 源码](https://github.com/Adrian-0925/open-source-stroll)

一个轻量的中文开源项目推荐站。用简短介绍说清项目能做什么，支持真实 GitHub 数据、自动中文简介、往日推荐和本机收藏。

![桌面端预览](docs/images/desktop.png)

> 界面截图用于展示视觉风格；每日推荐和数据会随更新变化，头像加载失败时使用文字缩写。[查看手机端](docs/images/mobile.png) · [查看作品页](docs/images/projects.jpg)

## 有什么

- **每日发现**：从不同用途筛选 6 个未推荐过的项目，同类最多 2 个、开发库最多 1 个；候选不足时保留上一期。
- **真实资料**：从 GitHub 官方接口获取 Star、许可证、语言和最近提交，缓存后统一展示。
- **中文简介**：依据官方资料独立撰写用途与使用门槛，其余项目自动翻译；使用提示保留原文和参考来源，翻译失败会重试。
- **轻量收藏**：只保存在当前浏览器，不上传；清理站点数据后会丢失。
- **作者作品**：主导航直接进入作品页，展示 PhonePulse、开源散步与 TokenTracker 个人 Fork，并保留原项目来源。
- **舒服阅读**：浅色页面、清楚的文字层级；手机首屏更紧凑，收藏按钮支持 44px 点击区域。往日期刊明确显示日期、期号与导航，右侧导读和发现随期刊变化。

保持简洁，让项目内容成为主角。先说用途和使用门槛，再展示技术信息，不堆砌榜单和复杂入口。

## 本地运行

需要 **Node.js 24 或更新版本**（使用内置 SQLite）。

```bash
npm ci
npm run build
npm start
```

浏览器打开 <http://127.0.0.1:4173>。首次显示内置的一期推荐；在另一个终端刷新真实数据：

```bash
npm run refresh
```

本地数据写入 `.local/data.sqlite`。GitHub 接口限流或翻译服务不可用时保留上次成功内容。可选 `GITHUB_TOKEN` 只供后台使用，不应放入网页或提交到仓库。

## 自动更新与部署

项目包含独立 Worker、D1 数据结构、每小时更新脚本和可选 GitHub Actions 工作流。只有页面的静态部署会显示初始内容；持续更新需要持久化后端和调度器。

- [部署与定时更新](docs/deployment.md)
- [项目结构与开发](docs/development.md)
- [贡献说明](CONTRIBUTING.md) · [安全说明](SECURITY.md)

## 数据与许可

项目资料来自 GitHub；部分用途说明依据官方资料独立撰写，其余简介由 MyMemory 翻译。完整原文和资料来源可在使用提示中查看，使用要求及许可仍以原仓库为准。本站未逐个安装测试被推荐项目，也不代表 GitHub 官方背书。

本站代码使用 [MIT License](LICENSE)。被推荐项目、作者头像和第三方素材遵循各自许可，不因本仓库采用 MIT 而改变。

欢迎通过 [Issues](https://github.com/Adrian-0925/open-source-stroll/issues) 报告问题或推荐项目。
