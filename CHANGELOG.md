# 📝 更新日志 (CHANGELOG)

> **版本**: v1.0.0
> **最后更新**: 2024-11-15

本文档记录了校园论坛后端系统的所有重要变更，包括新功能、改进、修复和破坏性变更。

---

## 版本说明

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **主版本号 (MAJOR)**: 不兼容的 API 修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

---

## [未发布] - 准备 v1.0.0

### 📝 待办事项

- [ ] 完成单元测试覆盖率达到 80%
- [ ] E2E 测试完整覆盖核心功能
- [ ] 性能测试和压力测试
- [ ] 安全审计
- [ ] 文档最终审核
- [ ] 生产环境部署验证

---

## [0.5.0] - 2024-11-15

### ✨ 新增

#### 权限系统重构
- **分离注册流程**: 普通用户和管理员注册接口分离
  - `POST /auth/register` - 普通用户注册 (强制 STUDENT 角色)
  - `POST /auth/register-admin` - 管理员注册 (需要密钥)
- **管理员密钥验证**: 通过环境变量 `ADMIN_REGISTRATION_KEY` 控制管理员注册
- **角色守卫增强**: 所有 `/admin/*` 接口自动验证 ADMIN 角色
- **权限测试脚本**: 自动化测试脚本 `test-permissions.sh`

#### 多端架构支持
- **双前端架构**: 支持校园论坛前端和管理后台前端
- **CORS 多源配置**: 通过环境变量支持多个前端域名
- **路由分层设计**:
  - 公开路由: `/posts`, `/comments` 等
  - 用户路由: 需要登录的功能
  - 管理路由: `/admin/*` 需要管理员权限

#### 请求日志中间件
- **详细日志记录**: 记录所有 HTTP 请求的详细信息
- **性能监控**: 记录每个请求的响应时间
- **安全过滤**: 自动过滤敏感信息 (如密码)

### 📚 文档

新增文档:
- **QUICK_START.md** - 快速开始指南
- **FRONTEND_API_GUIDE.md** - 前端 API 完整对接文档
- **MULTI_CLIENT_ARCHITECTURE.md** - 多端架构设计文档
- **IMPLEMENTATION_GUIDE.md** - 实施指南
- **PERMISSIONS.md** - 权限系统完整说明
- **PERMISSIONS_UPDATE.md** - 权限更新摘要
- **DEVELOPMENT_GUIDE.md** - 开发指南
- **TROUBLESHOOTING.md** - 故障排查指南
- **DOCUMENTATION_INDEX.md** - 完整文档索引

### 🔒 安全

- **修复权限提升漏洞**: 移除注册接口的 `role` 字段，防止用户自行设置为管理员
- **强制角色设置**: 普通注册强制设置为 `STUDENT` 角色
- **密钥保护**: 管理员注册需要验证 `ADMIN_REGISTRATION_KEY`

### 🐛 修复

- **CORS 配置错误**: 修复 CORS origin 配置错误导致前端无法访问
- **日志中间件崩溃**: 修复 GET 请求时 `req.body` 为 undefined 导致崩溃
- **参数验证问题**: 修复帖子查询接口 `sortBy` 参数验证

### 🔄 变更

#### ⚠️ 破坏性变更

- **注册接口变更**: `POST /auth/register` 不再接受 `role` 参数
  ```diff
  // 之前
  POST /auth/register
  {
    "username": "user",
    "email": "user@example.com",
    "password": "password",
  - "role": "ADMIN"  // ❌ 不再支持
  }

  // 现在 - 普通用户注册
  POST /auth/register
  {
    "username": "user",
    "email": "user@example.com",
    "password": "password"
    // role 自动设置为 STUDENT
  }

  // 现在 - 管理员注册
  POST /auth/register-admin
  {
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin_password",
  + "adminKey": "your-secret-key"  // ✅ 必须提供
  }
  ```

- **环境变量新增**: 必须配置 `ADMIN_REGISTRATION_KEY`
  ```env
  # .env
  ADMIN_REGISTRATION_KEY=your-secret-key-min-32-chars
  ```

#### 非破坏性变更

- **CORS 配置增强**: `CORS_ORIGIN` 支持逗号分隔的多个域名
- **日志输出优化**: 更清晰的请求日志格式

---

## [0.4.0] - 2024-11-15

### ✨ 新增

#### 实时功能
- **WebSocket 实时通知**: 支持服务器推送通知到前端
- **连接管理优化**: 修复内存泄漏问题，优化连接池管理
- **心跳机制**: 自动检测和清理失效连接

#### 用户体验功能
- **帖子草稿**: 支持保存草稿，避免内容丢失
- **帖子收藏**: 用户可以收藏喜欢的帖子
- **用户关注**: 关注感兴趣的用户

#### 推荐系统
- **热门推荐**: 基于浏览量和点赞数的热门帖子推荐
- **趋势推荐**: 基于时间衰减的趋势帖子推荐
- **热门话题**: 统计和推荐热门话题标签
- **Redis 缓存**: 推荐结果缓存提升性能

#### 系统优化
- **URL 版本控制**: API 路径添加 `/api/v1` 前缀
- **Session 配置**: 优化 Session 中间件配置
- **CORS 完善**: 更完善的跨域资源共享配置

### 🐛 修复

- **WebSocket 内存泄漏**: 修复 `MaxListenersExceededWarning` 警告
- **连接清理**: 正确清理断开的 WebSocket 连接
- **事件监听器泄漏**: 移除重复的事件监听器

### 📚 文档

- **WEBSOCKET_MEMORY_LEAK_FIX.md** - WebSocket 内存泄漏修复方案
- **COMPLETION_REPORT.md** - v0.4.0 完成报告
- **v0.4.0-completion-summary.md** - 详细完成总结

---

## [0.3.0] - 2024-11-14

### ✨ 新增

#### 搜索功能
- **全文搜索**: 支持关键词搜索帖子
- **标签筛选**: 按标签过滤帖子
- **多条件搜索**: 支持组合多个搜索条件

#### 通知系统
- **多种通知类型**: 点赞、评论、关注、系统通知
- **未读标记**: 支持标记通知为已读/未读
- **通知列表**: 分页查询通知列表
- **未读数量**: 实时获取未读通知数量

#### 管理后台
- **用户管理**: 查看、封禁、解封用户
- **举报处理**: 查看和处理用户举报
- **系统统计**: 用户数、帖子数等统计信息
- **内容管理**: 删除违规帖子和评论

### 🔒 安全

- **RBAC 权限系统**: 基于角色的访问控制
- **管理员验证**: 管理接口自动验证管理员权限
- **操作审计**: 记录管理员操作日志

---

## [0.2.0] - 2024-11-13

### ✨ 新增

#### 核心功能
- **帖子管理**: 发布、编辑、删除帖子
- **评论系统**: 一级评论和二级回复
- **点赞功能**: 对帖子和评论进行点赞/取消点赞
- **图片上传**: 支持上传帖子图片

#### 用户功能
- **个人资料**: 查看和编辑用户资料
- **发帖历史**: 查看用户发布的所有帖子
- **评论历史**: 查看用户的评论记录

### 🎨 改进

- **分页优化**: 所有列表接口支持分页
- **排序功能**: 支持按时间、热度等排序
- **查询性能**: 添加数据库索引优化查询

---

## [0.1.0] - 2024-11-12

### ✨ 新增

#### 认证系统
- **用户注册**: 邮箱 + 密码注册
- **用户登录**: 返回 JWT Token
- **Token 刷新**: 使用 Refresh Token 刷新 Access Token
- **密码加密**: 使用 bcrypt 加密存储

#### 基础架构
- **NestJS 框架**: 基于 NestJS v11 构建
- **PostgreSQL 数据库**: 使用 Prisma ORM
- **Redis 缓存**: 集成 Redis 支持
- **TypeScript**: 完整的类型定义

#### 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Prisma Studio**: 数据库可视化管理

### 📚 文档

- **README.md** - 项目说明
- **架构设计文档** - 系统架构设计
- **API 文档** - 接口详细文档
- **数据库指南** - Prisma 使用指南
- **部署指南** - 阿里云部署流程

---

## API 变更总览

### 认证相关

#### v0.5.0 新增
- `POST /auth/register-admin` - 管理员注册 (需要密钥)

#### v0.5.0 变更
- `POST /auth/register` - 移除 `role` 参数，强制设置为 STUDENT

#### v0.1.0 新增
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/refresh` - 刷新 Token

### 用户相关

#### v0.2.0 新增
- `GET /users/:id` - 获取用户信息
- `PATCH /users/:id` - 更新用户信息
- `GET /users/:id/posts` - 获取用户帖子列表

### 帖子相关

#### v0.4.0 新增
- `GET /posts/hot` - 获取热门帖子
- `GET /posts/trending` - 获取趋势帖子

#### v0.2.0 新增
- `GET /posts` - 获取帖子列表
- `GET /posts/:id` - 获取帖子详情
- `POST /posts` - 发布帖子
- `PATCH /posts/:id` - 编辑帖子
- `DELETE /posts/:id` - 删除帖子

### 评论相关

#### v0.2.0 新增
- `GET /posts/:id/comments` - 获取帖子评论
- `POST /comments` - 发布评论
- `DELETE /comments/:id` - 删除评论

### 点赞相关

#### v0.2.0 新增
- `POST /likes` - 点赞/取消点赞
- `GET /posts/:id/likes` - 获取帖子点赞数

### 通知相关

#### v0.3.0 新增
- `GET /notifications` - 获取通知列表
- `GET /notifications/unread/count` - 获取未读数量
- `PATCH /notifications/:id/read` - 标记为已读

### 搜索相关

#### v0.3.0 新增
- `GET /search` - 搜索帖子
- `GET /search/tags` - 搜索标签

### 管理相关

#### v0.3.0 新增
- `GET /admin/users` - 获取用户列表
- `POST /admin/users/:id/ban` - 封禁用户
- `POST /admin/users/:id/unban` - 解封用户
- `GET /admin/reports` - 获取举报列表
- `PATCH /admin/reports/:id` - 处理举报
- `GET /admin/statistics` - 系统统计

### 收藏相关

#### v0.4.0 新增
- `GET /favorites` - 获取收藏列表
- `POST /favorites` - 收藏帖子
- `DELETE /favorites/:id` - 取消收藏

### 关注相关

#### v0.4.0 新增
- `GET /follows` - 获取关注列表
- `POST /follows` - 关注用户
- `DELETE /follows/:id` - 取消关注

### 草稿相关

#### v0.4.0 新增
- `GET /drafts` - 获取草稿列表
- `POST /drafts` - 保存草稿
- `PATCH /drafts/:id` - 更新草稿
- `DELETE /drafts/:id` - 删除草稿

### 推荐相关

#### v0.4.0 新增
- `GET /recommendations/hot` - 热门推荐
- `GET /recommendations/trending` - 趋势推荐
- `GET /recommendations/topics` - 热门话题

---

## 数据库变更

### v0.5.0

无数据库结构变更，仅业务逻辑调整。

### v0.4.0

新增表:
- `Draft` - 草稿表
- `Favorite` - 收藏表
- `Follow` - 关注表

### v0.3.0

新增表:
- `Notification` - 通知表
- `Report` - 举报表

字段变更:
- `User` 表新增 `isBanned` 字段
- `User` 表新增 `bannedAt` 字段

### v0.2.0

新增表:
- `Post` - 帖子表
- `Comment` - 评论表
- `Like` - 点赞表

### v0.1.0

新增表:
- `User` - 用户表
- `RefreshToken` - 刷新令牌表

---

## 环境变量变更

### v0.5.0 新增

```env
# 管理员注册密钥 (必须)
ADMIN_REGISTRATION_KEY=your-secret-key-min-32-chars

# CORS 多源支持 (增强)
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### v0.4.0 新增

```env
# URL 版本前缀
API_PREFIX=/api/v1

# Session 配置
SESSION_SECRET=your-session-secret
```

### v0.3.0 新增

```env
# Redis 配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 缓存配置
CACHE_TTL=300
CACHE_POST_TTL=600
```

### v0.1.0 新增

```env
# 基础配置
NODE_ENV=development
PORT=3000

# 数据库
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3001
```

---

## 迁移指南

### 从 0.4.x 升级到 0.5.0

#### 1. 环境变量配置

添加新的环境变量:
```bash
# .env
ADMIN_REGISTRATION_KEY=your-secret-key-min-32-chars
```

#### 2. 前端代码调整

**管理员注册流程变更**:
```typescript
// 之前
await fetch('/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    username: 'admin',
    email: 'admin@example.com',
    password: 'password',
    role: 'ADMIN',  // ❌ 不再支持
  }),
});

// 现在
await fetch('/auth/register-admin', {  // ✅ 使用新接口
  method: 'POST',
  body: JSON.stringify({
    username: 'admin',
    email: 'admin@example.com',
    password: 'password',
    adminKey: 'your-secret-key',  // ✅ 必须提供
  }),
});
```

**普通用户注册无变化**:
```typescript
// 继续使用原有接口
await fetch('/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    username: 'user',
    email: 'user@example.com',
    password: 'password',
    // role 自动设置为 STUDENT
  }),
});
```

#### 3. 数据库迁移

无需运行数据库迁移。

#### 4. 测试验证

运行权限测试脚本验证升级:
```bash
./test-permissions.sh
```

---

## 致谢

感谢所有为本项目做出贡献的开发者！

---

## 相关链接

- [项目主页](https://github.com/your-org/school-forum-back-end)
- [问题反馈](https://github.com/your-org/school-forum-back-end/issues)
- [文档中心](./docs/DOCUMENTATION_INDEX.md)

---

<div align="center">

**📝 持续更新中...**

Made with ❤️ by 后端开发团队

</div>
