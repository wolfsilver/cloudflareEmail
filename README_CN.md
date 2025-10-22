# Cloudflare Email Worker - 邮件发送系统

基于 Cloudflare Workers 的邮件发送系统，支持邮件列表管理、富文本编辑、图片上传和附件存储。

## 功能特性

✅ **邮件发送**
- 支持 HTML 富文本邮件
- 可添加多个收件人
- 支持自定义发件人
- 邮件主题和内容编辑

✅ **邮件列表管理**
- 创建和管理邮件列表
- 添加/删除邮件地址
- 批量发送邮件到列表
- 列表描述和分类

✅ **富文本编辑器**
- 文本格式化（粗体、斜体、下划线）
- 有序和无序列表
- 图片插入支持
- HTML 内容预览

✅ **文件存储 (R2)**
- 图片上传和管理
- 附件存储
- 文件下载和删除
- 支持多种文件类型

## 技术栈

- **Cloudflare Workers**: 无服务器计算平台
- **Cloudflare Email Workers**: 邮件发送 API
- **Cloudflare R2**: 对象存储（图片和附件）
- **Cloudflare D1**: SQLite 数据库（邮件列表）
- **Hono**: 轻量级 Web 框架
- **TypeScript**: 类型安全的开发

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境

编辑 `wrangler.toml` 文件，配置以下内容：

```toml
# R2 存储桶
[[r2_buckets]]
binding = "EMAIL_ATTACHMENTS"
bucket_name = "your-bucket-name"

# D1 数据库
[[d1_databases]]
binding = "DB"
database_name = "email_database"
database_id = "your-database-id"

# 邮件发送配置
send_email = [
  {name = "SEB", destination_address = "verified@example.com"}
]
```

### 3. 创建 R2 存储桶

```bash
wrangler r2 bucket create email-attachments
```

### 4. 创建 D1 数据库

```bash
wrangler d1 create email_database
```

记录返回的 `database_id`，更新到 `wrangler.toml` 中。

### 5. 初始化数据库

部署后访问：
```
POST /api/init
```

### 6. 本地开发

```bash
npm run dev
```

访问 `http://localhost:8787` 查看 UI 界面。

### 7. 部署到 Cloudflare

```bash
npm run deploy
```

## API 文档

### 邮件发送

#### 发送单封邮件
```http
POST /api/send
Content-Type: application/json

{
  "to": [
    {"email": "recipient@example.com", "name": "收件人"}
  ],
  "subject": "邮件主题",
  "htmlBody": "<p>邮件内容</p>",
  "from": {"email": "sender@example.com", "name": "发件人"}
}
```

#### 发送到邮件列表
```http
POST /api/send-to-list/:listId
Content-Type: application/json

{
  "subject": "邮件主题",
  "htmlBody": "<p>邮件内容</p>",
  "from": {"email": "sender@example.com"}
}
```

### 邮件列表管理

#### 获取所有列表
```http
GET /api/lists
```

#### 获取单个列表
```http
GET /api/lists/:id
```

#### 创建列表
```http
POST /api/lists
Content-Type: application/json

{
  "name": "列表名称",
  "description": "列表描述"
}
```

#### 更新列表
```http
PUT /api/lists/:id
Content-Type: application/json

{
  "name": "新名称",
  "description": "新描述"
}
```

#### 删除列表
```http
DELETE /api/lists/:id
```

#### 添加邮箱到列表
```http
POST /api/lists/:id/emails
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "用户名"
}
```

#### 从列表删除邮箱
```http
DELETE /api/lists/:id/emails/:email
```

### 文件管理

#### 上传文件
```http
POST /api/files
Content-Type: multipart/form-data

file: <binary data>
```

#### 获取文件
```http
GET /api/files/:id/:filename
```

#### 删除文件
```http
DELETE /api/files/:id/:filename
```

## 项目结构

```
cloudflareEmail/
├── src/
│   ├── index.ts          # 主入口文件
│   ├── types.ts          # TypeScript 类型定义
│   ├── database.ts       # D1 数据库操作
│   ├── storage.ts        # R2 存储操作
│   └── email.ts          # 邮件发送逻辑
├── public/
│   └── index.html        # Web UI 界面
├── wrangler.toml         # Cloudflare 配置
├── package.json          # 项目依赖
└── tsconfig.json         # TypeScript 配置
```

## 使用说明

### Web UI 界面

部署后访问 Worker URL，可以看到包含三个标签页的界面：

1. **发送邮件**: 编写和发送邮件
   - 选择邮件列表或手动添加收件人
   - 输入邮件主题和内容
   - 使用富文本编辑器格式化内容
   - 上传附件

2. **邮件列表**: 管理邮件列表
   - 创建新列表
   - 查看现有列表
   - 添加/删除邮箱地址
   - 删除列表

3. **文件管理**: 管理上传的文件
   - 上传图片和附件
   - 查看已上传文件
   - 删除文件

### 邮件列表功能

邮件列表可以方便地管理一组邮箱地址，适用于以下场景：

- 公司内部通知
- 产品更新公告
- 营销活动推送
- 订阅用户管理

### 富文本编辑

编辑器支持：
- **加粗** / *斜体* / <u>下划线</u>
- 有序列表和无序列表
- 插入图片（支持 URL）
- HTML 格式

### 文件存储

所有上传的图片和附件存储在 Cloudflare R2 中：
- 无限存储空间
- 快速全球分发
- 低成本
- 高可用性

## 配置 Email Workers

### 1. 验证域名

在 Cloudflare Dashboard 中：
1. 进入 Email Routing
2. 添加并验证您的域名
3. 配置 DNS 记录

### 2. 设置发件地址

在 `wrangler.toml` 中配置验证过的发件地址：

```toml
send_email = [
  {name = "SEB", destination_address = "noreply@yourdomain.com"}
]
```

### 3. 测试邮件发送

```bash
curl -X POST https://your-worker.workers.dev/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"email": "test@example.com"}],
    "subject": "Test Email",
    "htmlBody": "<p>Hello from Cloudflare Workers!</p>"
  }'
```

## 安全建议

1. **访问控制**: 添加身份验证中间件
2. **速率限制**: 防止邮件滥发
3. **输入验证**: 验证所有用户输入
4. **CORS 配置**: 限制允许的来源
5. **环境变量**: 使用 secrets 存储敏感信息

## 开发说明

### 添加新功能

1. 在 `src/` 目录添加新模块
2. 在 `src/index.ts` 中注册路由
3. 更新 `src/types.ts` 添加类型定义
4. 测试和部署

### 调试

```bash
# 查看日志
wrangler tail

# 本地测试
npm run dev
```

## 常见问题

**Q: 为什么邮件发送失败？**
A: 检查：
- 域名是否已验证
- 发件地址是否正确配置
- 邮件内容是否符合规范

**Q: 如何增加邮件列表容量？**
A: D1 数据库支持大量数据，可以存储数万个邮箱地址。

**Q: R2 存储费用如何？**
A: R2 存储非常便宜，前 10GB 免费，之后每 GB 约 $0.015/月。

**Q: 可以定时发送邮件吗？**
A: 可以结合 Cloudflare Cron Triggers 实现定时任务。

## 参考文档

- [Cloudflare Email Workers](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
