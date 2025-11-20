# 项目结构文档

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
│   ├── core/                   # 基础设施层
│   │   ├── common/             # 公共模块
│   │   │   ├── decorators/     # 装饰器
│   │   │   ├── filters/        # 异常过滤器
│   │   │   ├── guards/         # 守卫
│   │   │   ├── interceptors/   # 拦截器
│   │   │   └── middleware/     # 中间件
│   │   ├── config/             # 配置文件
│   │   ├── prisma/             # Prisma ORM
│   │   └── redis/              # Redis 缓存
│   ├── features/               # 业务功能层
│   │   ├── marketplace/        # 市场模块
│   │   │   ├── secondhand      # 二手交易
│   │   │   ├── study-resources # 学习资源
│   │   │   ├── clubs           # 社团招新
│   │   │   ├── lost-found      # 失物招领
│   │   │   └── carpool         # 拼车拼单
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

### 社交表
- **Follow**: 关注关系表
- **Favorite**: 收藏表
- **Folder**: 收藏夹表

### 扩展表
- **PostDraft**: 帖子草稿表
- **PostScore**: 帖子评分表（热度算法）
- **UserPoints**: 用户积分表
- **UserPointsHistory**: 积分历史表
- **Report**: 举报表
- **Announcement**: 公告表

### 市场表
- **SecondhandItem**: 二手物品表
- **StudyResource**: 学习资源表
- **ClubRecruitment**: 社团招新表
- **LostAndFound**: 失物招领表
- **Carpool**: 拼车拼单表

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
- `/clubs/*`: 社团招新
- `/lost-found/*`: 失物招领
- `/carpool/*`: 拼车拼单
- `/announcements/*`: 公告
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
