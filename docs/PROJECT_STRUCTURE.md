# 整体后端架构文档

> **文档定位**：本文档站在后端工程师视角，全面描述项目的目录结构、模块划分、技术栈、数据库模型、权限系统、算法系统等架构设计。  
> 如需查看具体的 HTTP 接口定义，请参阅以下两份 API 接口文档：
> - **网站用户端服务**：《网站用户端 API 接口文档》（`API_DOCS_USER.md`）
> - **管理端/后台系统服务**：《管理端 / 后台系统端 API 接口文档》（`API_DOCS_BACKEND.md`）

## 服务边界说明

本后端系统对外提供 **两套独立服务**：

### 1. 网站用户端服务
- **服务对象**：网站前台前端（普通用户）
- **主要路由**：`/auth`、`/users`、`/posts`、`/comments`、`/favorites`、`/notifications`、`/activities`、`/conversations`、`/upload`、`/search`、`/recommendations`、`/algorithms`、`/points` 等
- **功能范围**：用户注册登录、浏览发帖、评论点赞、收藏关注、私信通知、推荐搜索、积分系统、文件上传等
- **详细接口**：请参阅《网站用户端 API 接口文档》

### 2. 管理端 / 后台系统服务
- **服务对象**：后台管理系统前端（管理员）
- **主要路由**：`/admin/*`、`/announcements`（管理员专用）
- **功能范围**：用户管理（封禁/解封/删除/改密）、内容审核（帖子置顶/加精/隐藏/删除）、评论管理、公告管理、系统统计等
- **详细接口**：请参阅《管理端 / 后台系统端 API 接口文档》

---

## 目录结构

```
school-forum-back-end/
├── prisma/
│   └── schema.prisma           # Prisma 数据库模型定义
├── src/
│   ├── admin/                  # 后台管理模块
│   ├── auth/                   # 认证授权模块
│   ├── content/                # 内容管理层
│   │   ├── announcements/      # 公告系统
│   │   ├── comments/           # 评论管理
│   │   └── posts/              # 帖子管理（含草稿）
│   ├── common/                 # 通用常量（如服务中心标签）
│   ├── core/                   # 基础设施层
│   │   ├── common/             # 公共模块
│   │   │   ├── decorators/     # 装饰器
│   │   │   ├── filters/        # 异常过滤器
│   │   │   ├── guards/         # 守卫
│   │   │   ├── interceptors/   # 拦截器
│   │   │   └── middleware/     # 中间件
│   │   ├── config/             # 配置文件
│   │   ├── prisma/             # Prisma ORM
│   │   └── redis/              # Redis
│   ├── features/               # 业务功能层
│   │   ├── activities/         # 动态流
│   │   ├── marketplace/        # 市场模块（当前仅保留二手和学习资源，其它场景通过 posts + tags 实现）
│   │   │   ├── secondhand      # 二手交易
│   │   │   └── study-resources # 学习资源
│   │   ├── recommendations/    # 推荐系统
│   │   │   ├── hot-post        # 热门算法
│   │   │   └── tag-algorithm   # 标签算法
│   │   ├── search/             # 搜索功能
│   │   └── social/             # 社交模块
│   │       ├── likes/          # 点赞
│   │       ├── favorites/      # 收藏
│   │       └── follows/        # 关注
│   ├── notifications/          # 通知系统
│   │   ├── notifications.gateway.ts    # WebSocket 网关
│   │   ├── realtime.service.ts         # 实时推送服务
│   │   └── notification-emitter.service.ts
│   ├── users/                  # 用户管理
│   │   ├── points              # 积分系统
│   │   └── users-activity      # 用户动态
│   ├── app.module.ts           # 应用主模块
│   ├── app.controller.ts       # 应用主控制器
│   ├── app.service.ts          # 应用主服务
│   └── main.ts                 # 应用入口
├── docs/                       # 文档目录
│   ├── API_DOCS_USER.md        # 用户端API文档
│   ├── API_DOCS_ADMIN.md       # 管理员端API文档
│   ├── API_DOCS_BACKEND.md     # 后台系统API文档
│   └── PROJECT_STRUCTURE.md    # 项目结构文档
├── .env                        # 环境变量
├── package.json                # 依赖配置
└── tsconfig.json               # TypeScript 配置
```

## 核心模块说明

### 1. 基础设施层 (core/)
- **common**: 公共模块，包含装饰器、守卫、过滤器、拦截器、中间件
- **config**: 应用配置（CORS、Session、Redis等）
- **prisma**: 数据库 ORM 服务
- **redis**: Redis 缓存服务

> 补充：`src/common/` 下仅存放公共常量（如服务中心标签），与 `src/core/common/` 的基础设施模块区分。

### 2. 内容管理层 (content/)
- **posts**: 帖子的增删改查、草稿管理
- **comments**: 评论的增删改查、回复功能
- **announcements**: 系统公告管理

### 3. 业务功能层 (features/)
- **social**: 社交功能（点赞、收藏、关注）
- **marketplace**: 校园市场（二手、资源、社团、失物、拼车）
- **recommendations**: 智能推荐系统
- **search**: 全文搜索

### 4. 其他核心模块
- **auth**: JWT 认证、登录注册
- **users**: 用户管理、积分系统、用户动态
- **notifications**: 实时通知、WebSocket 推送
- **admin**: 后台管理功能

## 数据库模型

### 核心表
- **User**: 用户表
- **Post**: 帖子表
- **Comment**: 评论表
- **Like**: 点赞表
- **Notification**: 通知表
 - **Announcement**: 公告表

### 社交表
- **Follow**: 关注关系表
- **Favorite**: 收藏表
- **Folder**: 收藏夹表
 - **Topic**: 话题表

### 扩展表
- **PostDraft**: 帖子草稿表
- **PostScore**: 帖子评分表（热度算法）
- **UserPoints**: 用户积分表
- **UserPointsHistory**: 积分历史表
 - **UserLoginHistory**: 用户登录历史表
 - **VerificationCode**: 验证码表

### 市场表
- **SecondhandItem**: 二手物品表
- **StudyResource**: 学习资源表

### 实时通信表
- **Conversation**: 私信会话表
- **ConversationParticipant**: 会话参与者表
- **Message**: 私信消息表

## 技术栈

- **框架**: NestJS 11
- **语言**: TypeScript 5
- **数据库**: PostgreSQL + Prisma ORM 6
- **缓存**: Redis
- **实时通信**: Socket.IO (WebSocket)
- **认证**: JWT (Passport)
- **定时任务**: @nestjs/schedule
- **会话**: Express Session + Redis Store

## API 路由规范

- `/auth/*`: 认证相关
- `/users/*`: 用户相关
- `/posts/*`: 帖子相关
- `/comments/*`: 评论相关
- `/likes/*`: 点赞相关
- `/favorites/*`: 收藏相关
- `/notifications/*`: 通知相关
- `/search/*`: 搜索相关
- `/recommendations/*`: 推荐相关
- `/algorithms/*`: 算法相关
- `/points/*`: 积分相关
- `/secondhand/*`: 二手交易
- `/study-resources/*`: 学习资源
- `/announcements/*`: 公告
- `/service-center/*`: 校园服务中心聚合接口（基于帖子标签分类）
- `/conversations/*`: 私信会话与消息
- `/activities/*`: 动态流
- `/admin/*`: 后台管理

## 权限系统

### 角色
- **USER**: 普通用户
- **ADMIN**: 管理员

### 守卫
- **JwtAuthGuard**: JWT 认证守卫（全局）
- **RolesGuard**: 角色权限守卫（全局）

### 装饰器
- **@Public()**: 标记公开接口，无需认证
- **@Roles('ADMIN')**: 限制只有管理员可访问
- **@CurrentUser()**: 获取当前登录用户

## 实时通知系统

### WebSocket 事件
- `notification:new`: 新通知
- `post:new`: 新帖子（关注的人发帖）
- `follower:new`: 新粉丝
- `notification:unread-count`: 未读数更新

### 实时推送场景
1. 帖子被评论/回复
2. 帖子/评论被点赞
3. 被他人关注
4. 关注的人发帖
5. 系统公告

## 算法系统

### 热门帖子算法（Reddit算法改进）
```
hotScore = (likes - 1) / (ageInHours + 2)^1.5 × viewWeight × commentWeight
```

### 趋势帖子算法
```
trendingScore = recentInteractions / timeDecay
```

### 标签算法
- 热门标签：根据标签使用频率
- 趋势标签：根据标签增长速度
- 相关标签：根据共现频率

## 积分系统

### 积分规则
- 发布帖子：+10
- 发布评论：+5
- 获得点赞：+2
- 帖子加精：+50
- 每日登录：+1
- 连续登录：+5

### 等级系统
- 11 级等级
- 等级门槛：0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500

## 开发规范

### 文件命名
- 模块：`xxx.module.ts`
- 控制器：`xxx.controller.ts`
- 服务：`xxx.service.ts`
- DTO：`xxx.dto.ts`
- Guard：`xxx.guard.ts`

### 代码规范
- 使用 ESLint + Prettier
- 遵循 NestJS 官方最佳实践
- 所有 API 必须有注释说明
- DTO 必须使用 class-validator 验证

### Git 规范
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

## 部署说明

### 环境变量
```env
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
SESSION_SECRET=your-session-secret
PORT=3000
```

### 启动命令
```bash
# 开发
pnpm run dev

# 生产
pnpm run build
pnpm run start:prod
```
