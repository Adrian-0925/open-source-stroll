# 安全

公开版本的 `/api/admin/*` 默认关闭，设置服务端 `UPDATE_TOKEN` 后才接受匹配的 `Authorization: Bearer`。只读页面与 `/api/feed` 可独立访问。生产部署使用足够长的随机令牌，通过部署平台或 GitHub Actions Secrets 配置。

不要把 `.env`、`.local`、SQLite 数据库、访问令牌、平台服务凭据或私有部署标识提交到仓库。不要把 `UPDATE_TOKEN` 或 `GITHUB_TOKEN` 放入前端。

请使用仓库 Security 页的 **Report a vulnerability** 私下报告漏洞（如该入口可用），避免在公开 Issue 中粘贴密钥、可直接利用的细节或个人资料。
