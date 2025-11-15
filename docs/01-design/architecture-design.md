# 校园论坛后台系统 - 架构设计文档

## 1. 系统概述

校园论坛后台系统是基于 NestJS 框架开发的 RESTful API 服务，为校园用户提供发帖、评论、点赞、搜索等社交互动功能。系统采用模块化架构设计，支持水平扩展和微服务化演进。

### 1.1 技术栈

- **框架**: NestJS v11 (基于 Express)
- **语言**: TypeScript v5.7
- **运行时**: Node.js >= 18
- **包管理**: pnpm
- **数据库**: PostgreSQL >= 14
- **ORM**: Prisma
- **缓存**: Redis >= 6.0
- **认证**: JWT (JSON Web Token) + Passport
- **云服务提供商**: 阿里云
  - **ECS**: 应用服务器
  - **RDS PostgreSQL**: 托管数据库
  - **Redis**: 托管缓存服务
  - **OSS**: 对象存储 (图片/文件)
- **文件存储**: 阿里云 OSS / 本地存储

### 1.2 核心特性

- 用户注册与身份认证（JWT）
- 帖子 CRUD 操作
- 评论系统（支持二级评论）
- 点赞功能
- 全文搜索
- 用户个人中心
- 内容审核与举报
- 实时通知系统

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│              (Web / Mobile / Desktop)                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │
┌────────────────────▼────────────────────────────────────┐
│                  API Gateway Layer                       │
│              (Nginx / API Gateway)                       │
│          - Rate Limiting                                 │
│          - Load Balancing                                │
│          - SSL Termination                               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Application Layer (NestJS)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Auth    │  │  Posts   │  │  Users   │             │
│  │  Module  │  │  Module  │  │  Module  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Comments │  │  Likes   │  │  Search  │             │
│  │  Module  │  │  Module  │  │  Module  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐                            │
│  │Notification│ │  Admin   │                            │
│  │  Module  │  │  Module  │                            │
│  └──────────┘  └──────────┘                            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼────────┐
│ PostgreSQL   │ │  Redis  │ │ Ali OSS   │
│   (RDS)      │ │ (Cache) │ │  (File)   │
└──────────────┘ └─────────┘ └───────────┘
```

**说明**:
- **Client Layer**: Web、移动端、桌面端客户端
- **API Gateway**: 阿里云 API 网关或 Nginx
- **Application Layer**: NestJS 应用服务器 (阿里云 ECS)
- **PostgreSQL**: 阿里云 RDS PostgreSQL 托管数据库
- **Redis**: 阿里云 Redis 托管缓存服务
- **Ali OSS**: 阿里云对象存储服务

### 2.2 分层架构

#### Controller Layer (控制层)
- 处理 HTTP 请求与响应
- 参数验证 (使用 class-validator)
- 路由定义
- 权限守卫应用

#### Service Layer (业务逻辑层)
- 实现核心业务逻辑
- 事务管理
- 数据验证与转换
- 跨模块服务调用

#### Repository Layer (数据访问层)
- 数据库操作封装
- 实体定义
- 查询构建
- 数据持久化

#### Common Layer (公共层)
- 拦截器 (Interceptors)
- 过滤器 (Filters)
- 管道 (Pipes)
- 守卫 (Guards)
- 装饰器 (Decorators)
- 工具类 (Utils)

## 3. 模块设计

### 3.1 核心模块

#### 3.1.1 认证模块 (Auth Module)

**职责**: 用户注册、登录、令牌管理

**组件**:
- `AuthController`: 处理认证相关请求
- `AuthService`: 认证业务逻辑
- `JwtStrategy`: JWT 验证策略
- `LocalStrategy`: 本地登录策略
- `JwtAuthGuard`: JWT 认证守卫
- `RolesGuard`: 角色权限守卫

**依赖**:
- `@nestjs/jwt`
- `@nestjs/passport`
- `passport-jwt`
- `bcrypt`

**关键功能**:
- 用户注册（密码加密）
- 用户登录（JWT 签发）
- 令牌刷新
- 密码重置
- 邮箱验证

#### 3.1.2 用户模块 (Users Module)

**职责**: 用户信息管理

**组件**:
- `UsersController`: 用户相关 API
- `UsersService`: 用户业务逻辑
- `User Entity`: 用户实体模型

**数据模型**:
```typescript
User {
  id: string (UUID)
  username: string (唯一)
  email: string (唯一)
  password: string (加密)
  studentId?: string (学号/工号)
  nickname?: string
  avatar?: string
  bio?: string (个人简介)
  role: enum (student, teacher, admin)
  isActive: boolean
  isBanned: boolean
  createdAt: Date
  updatedAt: Date
}
```

**关键功能**:
- 获取用户资料
- 更新用户资料
- 用户统计数据
- 用户列表（管理员）

#### 3.1.3 帖子模块 (Posts Module)

**职责**: 帖子内容管理

**组件**:
- `PostsController`: 帖子 API
- `PostsService`: 帖子业务逻辑
- `Post Entity`: 帖子实体模型

**数据模型**:
```typescript
Post {
  id: string (UUID)
  title: string
  content: string
  images?: string[] (图片URL数组)
  authorId: string (外键)
  tags: string[]
  viewCount: number
  likeCount: number
  commentCount: number
  isDeleted: boolean
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

**关键功能**:
- 创建帖子
- 编辑帖子
- 删除帖子（软删除）
- 获取帖子详情
- 获取帖子列表（分页、排序）
- 按标签筛选
- 增加浏览量

#### 3.1.4 评论模块 (Comments Module)

**职责**: 评论与回复管理

**组件**:
- `CommentsController`: 评论 API
- `CommentsService`: 评论业务逻辑
- `Comment Entity`: 评论实体模型

**数据模型**:
```typescript
Comment {
  id: string (UUID)
  content: string
  postId: string (外键)
  authorId: string (外键)
  parentId?: string (父评论ID，用于二级评论)
  likeCount: number
  isDeleted: boolean
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

**关键功能**:
- 创建评论
- 回复评论
- 删除评论（软删除）
- 获取帖子评论列表
- 评论分页

#### 3.1.5 点赞模块 (Likes Module)

**职责**: 点赞/取消点赞

**组件**:
- `LikesController`: 点赞 API
- `LikesService`: 点赞业务逻辑
- `Like Entity`: 点赞记录

**数据模型**:
```typescript
Like {
  id: string (UUID)
  userId: string (外键)
  targetId: string (帖子或评论ID)
  targetType: enum (post, comment)
  createdAt: Date
}
```

**关键功能**:
- 点赞/取消点赞帖子
- 点赞/取消点赞评论
- 获取用户点赞列表
- 防止重复点赞（唯一索引）

#### 3.1.6 搜索模块 (Search Module)

**职责**: 全文搜索功能

**组件**:
- `SearchController`: 搜索 API
- `SearchService`: 搜索业务逻辑

**技术方案**:
- 基础版: 数据库 LIKE 查询
- 进阶版: Elasticsearch 全文索引

**关键功能**:
- 关键词搜索
- 按标签筛选
- 按时间排序
- 按热度排序
- 搜索结果分页

#### 3.1.7 通知模块 (Notifications Module)

**职责**: 用户通知管理

**组件**:
- `NotificationsController`: 通知 API
- `NotificationsService`: 通知业务逻辑
- `Notification Entity`: 通知实体

**数据模型**:
```typescript
Notification {
  id: string (UUID)
  userId: string (接收者)
  type: enum (comment, reply, like, system)
  title: string
  content: string
  relatedId?: string (相关帖子/评论ID)
  isRead: boolean
  createdAt: Date
}
```

**关键功能**:
- 创建通知
- 获取通知列表
- 标记已读
- 批量标记已读
- 未读通知计数

#### 3.1.8 管理模块 (Admin Module)

**职责**: 内容审核与系统管理

**组件**:
- `AdminController`: 管理 API
- `AdminService`: 管理业务逻辑
- `Report Entity`: 举报记录

**数据模型**:
```typescript
Report {
  id: string (UUID)
  reporterId: string (举报人)
  targetId: string (被举报内容ID)
  targetType: enum (post, comment, user)
  reason: string
  status: enum (pending, approved, rejected)
  handlerId?: string (处理人)
  handleNote?: string
  createdAt: Date
  handledAt?: Date
}
```

**关键功能**:
- 举报内容
- 查看举报列表
- 处理举报
- 隐藏违规内容
- 封禁用户
- 操作日志

## 4. 数据库设计

### 4.1 数据库选型

本项目使用 **PostgreSQL** 作为主数据库，原因如下：

- **功能丰富**: 支持 JSON、全文搜索、数组等高级数据类型
- **性能优秀**: 适合复杂查询和高并发场景
- **数据完整性**: 完善的事务支持和约束机制
- **开源免费**: 无商业许可限制
- **云服务支持**: 阿里云 RDS PostgreSQL 提供托管服务

### 4.2 ORM 选型

使用 **Prisma** 作为 ORM 框架：

- **类型安全**: 自动生成 TypeScript 类型
- **直观的查询**: 易读易写的查询 API
- **迁移管理**: 内置数据库迁移工具
- **性能优秀**: 查询优化和批量处理
- **开发体验**: Prisma Studio 可视化管理

### 4.3 Prisma Schema 设计

完整的数据模型定义 (prisma/schema.prisma):

```prisma
// Prisma Schema 文件
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户表
model User {
  id         String   @id @default(uuid())
  username   String   @unique @db.VarChar(50)
  email      String   @unique @db.VarChar(100)
  password   String   @db.VarChar(255)  // bcrypt 加密
  studentId  String?  @map("student_id") @db.VarChar(50)
  nickname   String?  @db.VarChar(100)
  avatar     String?  @db.VarChar(500)
  bio        String?  @db.VarChar(500)
  role       Role     @default(STUDENT)
  isActive   Boolean  @default(true) @map("is_active")
  isBanned   Boolean  @default(false) @map("is_banned")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // 关联关系
  posts         Post[]
  comments      Comment[]
  likes         Like[]
  notifications Notification[]
  reports       Report[]       @relation("reporter")
  handledReports Report[]      @relation("handler")

  @@map("users")
  @@index([email])
  @@index([username])
}

// 用户角色枚举
enum Role {
  STUDENT
  TEACHER
  ADMIN
}

// 帖子表
model Post {
  id           String    @id @default(uuid())
  title        String    @db.VarChar(200)
  content      String    @db.Text
  images       String[]  // PostgreSQL 数组类型
  authorId     String    @map("author_id")
  tags         String[]
  viewCount    Int       @default(0) @map("view_count")
  likeCount    Int       @default(0) @map("like_count")
  commentCount Int       @default(0) @map("comment_count")
  isDeleted    Boolean   @default(false) @map("is_deleted")
  deletedAt    DateTime? @map("deleted_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // 关联关系
  author   User      @relation(fields: [authorId], references: [id])
  comments Comment[]
  likes    Like[]

  @@map("posts")
  @@index([authorId, createdAt])
  @@index([createdAt])
  @@index([tags])
}

// 评论表
model Comment {
  id        String    @id @default(uuid())
  content   String    @db.Text
  postId    String    @map("post_id")
  authorId  String    @map("author_id")
  parentId  String?   @map("parent_id") // 父评论ID (二级评论)
  likeCount Int       @default(0) @map("like_count")
  isDeleted Boolean   @default(false) @map("is_deleted")
  deletedAt DateTime? @map("deleted_at")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  // 关联关系
  post   Post      @relation(fields: [postId], references: [id])
  author User      @relation(fields: [authorId], references: [id])
  parent Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies Comment[] @relation("CommentReplies")
  likes  Like[]

  @@map("comments")
  @@index([postId, createdAt])
  @@index([authorId])
  @@index([parentId])
}

// 点赞表
model Like {
  id         String     @id @default(uuid())
  userId     String     @map("user_id")
  targetId   String     @map("target_id")
  targetType TargetType @map("target_type")
  createdAt  DateTime   @default(now()) @map("created_at")

  // 关联关系
  user    User     @relation(fields: [userId], references: [id])
  post    Post?    @relation(fields: [targetId], references: [id])
  comment Comment? @relation(fields: [targetId], references: [id])

  @@unique([userId, targetId, targetType])
  @@map("likes")
  @@index([userId, targetType, createdAt])
}

// 点赞目标类型枚举
enum TargetType {
  POST
  COMMENT
}

// 通知表
model Notification {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  type      NotificationType
  title     String           @db.VarChar(200)
  content   String           @db.Text
  relatedId String?          @map("related_id") // 相关帖子/评论ID
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at")

  // 关联关系
  user User @relation(fields: [userId], references: [id])

  @@map("notifications")
  @@index([userId, isRead, createdAt])
}

// 通知类型枚举
enum NotificationType {
  COMMENT
  REPLY
  LIKE
  SYSTEM
}

// 举报表
model Report {
  id         String       @id @default(uuid())
  reporterId String       @map("reporter_id")
  targetId   String       @map("target_id")
  targetType ReportTarget @map("target_type")
  reason     String       @db.Text
  status     ReportStatus @default(PENDING)
  handlerId  String?      @map("handler_id")
  handleNote String?      @map("handle_note") @db.Text
  createdAt  DateTime     @default(now()) @map("created_at")
  handledAt  DateTime?    @map("handled_at")

  // 关联关系
  reporter User  @relation("reporter", fields: [reporterId], references: [id])
  handler  User? @relation("handler", fields: [handlerId], references: [id])

  @@map("reports")
  @@index([status, createdAt])
}

// 举报目标类型枚举
enum ReportTarget {
  POST
  COMMENT
  USER
}

// 举报状态枚举
enum ReportStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### 4.4 核心表结构

#### users (用户表)
- id (PK, UUID)
- username (唯一索引)
- email (唯一索引)
- password (加密)
- student_id
- nickname
- avatar
- bio
- role
- is_active
- is_banned
- created_at
- updated_at

#### posts (帖子表)
- id (PK, UUID)
- title (全文索引)
- content (全文索引)
- images (JSON)
- author_id (FK → users.id, 索引)
- tags (JSON, 索引)
- view_count
- like_count
- comment_count
- is_deleted
- deleted_at
- created_at (索引)
- updated_at

#### comments (评论表)
- id (PK, UUID)
- content
- post_id (FK → posts.id, 索引)
- author_id (FK → users.id, 索引)
- parent_id (FK → comments.id, 可空, 索引)
- like_count
- is_deleted
- deleted_at
- created_at (索引)
- updated_at

#### likes (点赞表)
- id (PK, UUID)
- user_id (FK → users.id)
- target_id
- target_type (enum: post, comment)
- created_at
- UNIQUE(user_id, target_id, target_type)

#### notifications (通知表)
- id (PK, UUID)
- user_id (FK → users.id, 索引)
- type
- title
- content
- related_id
- is_read (索引)
- created_at (索引)

#### reports (举报表)
- id (PK, UUID)
- reporter_id (FK → users.id)
- target_id
- target_type
- reason
- status (索引)
- handler_id (FK → users.id)
- handle_note
- created_at
- handled_at

### 4.2 索引策略

**复合索引**:
- posts: (author_id, created_at)
- comments: (post_id, created_at)
- notifications: (user_id, is_read, created_at)
- likes: (user_id, target_type, created_at)

**全文索引**:
- posts: (title, content)

## 5. 安全设计

### 5.1 认证与授权

- **JWT 认证**: 所有需要登录的接口使用 JWT 验证
- **角色权限**: 学生、教师、管理员三级权限
- **令牌刷新**: Access Token (15分钟) + Refresh Token (7天)

### 5.2 数据安全

- **密码加密**: bcrypt (salt rounds: 10)
- **SQL 注入防护**: ORM 参数化查询
- **XSS 防护**: 输入过滤，输出转义
- **CSRF 防护**: SameSite Cookie

### 5.3 API 安全

- **Rate Limiting**: 限流防止暴力攻击
  - 登录接口: 5次/分钟
  - 注册接口: 3次/小时
  - 普通接口: 100次/分钟
- **请求验证**: class-validator + DTO
- **CORS 配置**: 仅允许指定域名

### 5.4 内容安全

- **敏感词过滤**: 维护敏感词库
- **图片审核**: 集成第三方审核服务
- **举报机制**: 用户举报 + 管理员审核

## 6. 性能优化

### 6.1 缓存策略

**Redis 缓存**:
- 热门帖子列表 (TTL: 5分钟)
- 用户信息 (TTL: 30分钟)
- 帖子详情 (TTL: 10分钟)
- 点赞计数 (TTL: 1分钟)

**缓存更新策略**:
- Write-Through: 写入时同步更新缓存
- Cache-Aside: 读取时检查缓存
- 主动失效: 数据变更时删除缓存

### 6.2 数据库优化

- **分页查询**: 使用游标分页，避免 OFFSET
- **批量操作**: 合并多次查询
- **预加载**: 避免 N+1 查询
- **只读副本**: 读写分离

### 6.3 并发控制

- **乐观锁**: 使用版本号防止并发更新
- **分布式锁**: Redis 实现防止重复点赞
- **事务隔离**: 使用数据库事务保证一致性

## 7. 可扩展性设计

### 7.1 水平扩展

- **无状态设计**: 应用服务器无状态，支持多实例
- **Session 存储**: JWT + Redis，支持分布式
- **负载均衡**: Nginx / AWS ALB

### 7.2 模块化

- **松耦合**: 模块间通过接口通信
- **事件驱动**: 使用 Event Emitter 解耦业务
- **插件化**: 支持功能模块动态加载

### 7.3 微服务演进

**Phase 1 - 单体应用** (当前)
- 所有模块在一个 NestJS 应用中

**Phase 2 - 模块化单体**
- 模块独立部署，共享数据库

**Phase 3 - 微服务架构**
- 服务拆分：Auth、Posts、Users、Notifications
- 服务间通信：gRPC / Message Queue

## 8. 监控与日志

### 8.1 日志系统

- **日志级别**: ERROR, WARN, INFO, DEBUG
- **日志格式**: JSON 结构化日志
- **日志收集**: Winston + ELK Stack
- **关键日志**:
  - 登录/注册操作
  - 数据库错误
  - API 慢查询
  - 异常错误栈

### 8.2 监控指标

- **应用监控**: CPU、内存、请求数、响应时间
- **数据库监控**: 连接池、慢查询、锁等待
- **缓存监控**: 命中率、内存使用
- **业务监控**: DAU、帖子数、评论数

### 8.3 告警机制

- **错误告警**: 5xx 错误率 > 1%
- **性能告警**: API 响应时间 > 3s
- **资源告警**: CPU > 80%, 内存 > 85%

## 9. 部署架构

### 9.1 开发环境

```
Local Development
├── Node.js v18+
├── MySQL/PostgreSQL (Docker)
├── Redis (Docker)
└── File Storage (本地)
```

### 9.2 生产环境 (阿里云)

```
阿里云生产环境架构
┌─────────────────────────────────────────────────────────┐
│                     Internet                             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              阿里云 SLB 负载均衡器                        │
│          (负载均衡 + SSL 证书 + 健康检查)                 │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼─────────┐      ┌───────▼─────────┐
│   ECS 实例 1    │      │   ECS 实例 2    │
│  (NestJS App)   │      │  (NestJS App)   │
│   + Nginx       │      │   + Nginx       │
└───────┬─────────┘      └───────┬─────────┘
        │                         │
        └─────────┬───────────────┘
                  │
     ┌────────────┼────────────┬──────────────┐
     │            │            │              │
┌────▼────┐ ┌────▼────┐ ┌────▼────┐  ┌─────▼─────┐
│   RDS   │ │  Redis  │ │   OSS   │  │    CDN    │
│   PG    │ │ Cluster │ │ Bucket  │  │  (静态)   │
│(主从复制)│ │ (哨兵)  │ │         │  │           │
└─────────┘ └─────────┘ └─────────┘  └───────────┘
```

**组件说明**:

1. **阿里云 SLB (Server Load Balancer)**
   - 提供负载均衡
   - SSL/TLS 证书管理
   - 健康检查
   - 跨可用区部署

2. **阿里云 ECS (弹性计算服务)**
   - 规格: ecs.c6.large (2核4G) × 2
   - 操作系统: Ubuntu 22.04 LTS
   - 部署方式: PM2 + Nginx
   - 自动扩容: 基于 CPU/内存使用率

3. **阿里云 RDS PostgreSQL**
   - 版本: PostgreSQL 14
   - 规格: pg.n2.medium.1 (2核4G)
   - 存储: 100GB SSD
   - 主从复制 + 自动备份
   - 读写分离

4. **阿里云 Redis**
   - 版本: Redis 6.0
   - 规格: redis.master.mid.default (2核4G)
   - 实例类型: 标准版-双副本
   - 哨兵模式高可用

5. **阿里云 OSS (对象存储)**
   - 存储类型: 标准存储
   - 访问控制: 私有读写 + CDN
   - 跨域配置: CORS
   - 生命周期管理

6. **阿里云 CDN**
   - 加速 OSS 静态资源
   - 全球节点分发
   - HTTPS 加速

**网络架构**:
- VPC 专有网络隔离
- ECS、RDS、Redis 部署在同一 VPC
- 安全组配置访问控制
- 白名单机制

## 10. 开发规范

### 10.1 代码规范

- **命名规范**: camelCase (变量), PascalCase (类), kebab-case (文件)
- **文件组织**: 每个模块独立文件夹
- **注释要求**: 复杂逻辑必须注释
- **错误处理**: 统一异常过滤器

### 10.2 Git 工作流

- **分支策略**: Git Flow
  - main: 生产环境
  - develop: 开发环境
  - feature/*: 功能分支
  - hotfix/*: 紧急修复
- **Commit 规范**: Conventional Commits
  - feat: 新功能
  - fix: 修复
  - docs: 文档
  - refactor: 重构
  - test: 测试


## 11. 扩展功能设计

### 11.1 实时消息推送 (WebSocket)

**功能描述**：
- 实时推送评论、点赞、系统通知
- 在线状态显示
- 实时聊天功能

**技术方案**：
```typescript
// 使用 @nestjs/websockets
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  // 推送通知给特定用户
  notifyUser(userId: string, notification: any) {
    this.server.to(userId).emit('notification', notification);
  }
}
```

**数据库设计**：
```prisma
// 在线状态表
model UserOnlineStatus {
  id         String   @id @default(uuid())
  userId     String   @unique @map("user_id")
  isOnline   Boolean  @default(false) @map("is_online")
  lastSeen   DateTime @map("last_seen")
  socketId   String?  @map("socket_id")

  user User @relation(fields: [userId], references: [id])

  @@map("user_online_status")
}
```

**部署要求**：
- 使用 Redis Adapter 支持多实例
- 配置 Socket.IO CORS
- 启用心跳检测

---

### 11.2 帖子草稿功能

**功能描述**：
- 自动保存草稿
- 草稿列表管理
- 草稿恢复与删除

**数据库设计**：
```prisma
model PostDraft {
  id        String    @id @default(uuid())
  title     String?   @db.VarChar(200)
  content   String?   @db.Text
  images    String[]
  tags      String[]
  authorId  String    @map("author_id")
  postId    String?   @map("post_id") // 关联已发布的帖子
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  author User  @relation(fields: [authorId], references: [id])
  post   Post? @relation(fields: [postId], references: [id])

  @@map("post_drafts")
  @@index([authorId, updatedAt])
}
```

**API 设计**：
```typescript
// POST /posts/drafts - 创建/更新草稿
// GET /posts/drafts - 获取草稿列表
// GET /posts/drafts/:id - 获取单个草稿
// DELETE /posts/drafts/:id - 删除草稿
// POST /posts/drafts/:id/publish - 发布草稿
```

**前端集成**：
- 每 30 秒自动保存
- 使用 LocalStorage 作为备份
- 离线编辑支持

---

### 11.3 图片压缩与优化

**功能描述**：
- 上传时自动压缩图片
- 生成多种尺寸（缩略图、中图、原图）
- WebP 格式转换
- 图片懒加载支持

**技术方案**：
```typescript
import * as sharp from 'sharp';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageService {
  async processImage(file: Express.Multer.File) {
    const sizes = {
      thumbnail: { width: 200, height: 200 },
      medium: { width: 800, height: 800 },
      large: { width: 1920, height: 1920 }
    };

    const results = {};

    for (const [key, size] of Object.entries(sizes)) {
      // 压缩并转换为 WebP
      const buffer = await sharp(file.buffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 85 })
        .toBuffer();

      // 上传到 OSS
      const url = await this.uploadToOSS(buffer, `${key}-${file.filename}.webp`);
      results[key] = url;
    }

    return results;
  }
}
```

**阿里云 OSS 配置**：
- 启用图片处理服务
- 配置图片样式（缩略图、水印）
- CDN 缓存优化

**数据库扩展**：
```prisma
model PostImage {
  id         String   @id @default(uuid())
  postId     String   @map("post_id")
  original   String   @db.VarChar(500) // 原图 URL
  large      String   @db.VarChar(500)
  medium     String   @db.VarChar(500)
  thumbnail  String   @db.VarChar(500)
  width      Int
  height     Int
  size       Int      // 文件大小（字节）
  createdAt  DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id])

  @@map("post_images")
  @@index([postId])
}
```

---

### 11.4 富文本编辑器支持

**功能描述**：
- Markdown 编辑器
- 富文本 WYSIWYG 编辑
- 代码高亮
- 表情包支持
- @提及用户

**推荐方案**：
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)
- **富文本**: [Quill](https://quilljs.com/) 或 [TipTap](https://tiptap.dev/)

**后端处理**：
```typescript
import * as DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

@Injectable()
export class ContentService {
  // 清理 XSS
  sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class']
    });
  }

  // Markdown 转 HTML
  markdownToHtml(markdown: string): string {
    const html = marked.parse(markdown);
    return this.sanitizeHtml(html);
  }
}
```

**数据库调整**：
```prisma
model Post {
  // ... 其他字段
  content       String    @db.Text      // 原始内容
  contentType   ContentType @default(MARKDOWN) @map("content_type")
  contentHtml   String?   @db.Text      // 渲染后的 HTML

  // ...
}

enum ContentType {
  PLAIN_TEXT   // 纯文本
  MARKDOWN     // Markdown
  HTML         // 富文本 HTML
}
```

---

### 11.5 帖子收藏功能

**功能描述**：
- 收藏/取消收藏帖子
- 收藏夹分类管理
- 收藏列表查看

**数据库设计**：
```prisma
// 收藏夹表
model Folder {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  name        String   @db.VarChar(50)
  description String?  @db.VarChar(200)
  isDefault   Boolean  @default(false) @map("is_default")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user       User       @relation(fields: [userId], references: [id])
  favorites  Favorite[]

  @@map("folders")
  @@index([userId])
}

// 收藏表
model Favorite {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  postId    String   @map("post_id")
  folderId  String   @map("folder_id")
  note      String?  @db.Text // 收藏备注
  createdAt DateTime @default(now()) @map("created_at")

  user   User   @relation(fields: [userId], references: [id])
  post   Post   @relation(fields: [postId], references: [id])
  folder Folder @relation(fields: [folderId], references: [id])

  @@unique([userId, postId]) // 同一用户不能重复收藏同一帖子
  @@map("favorites")
  @@index([userId, createdAt])
  @@index([postId])
}
```

**API 设计**：
```typescript
// POST /favorites - 收藏帖子
// DELETE /favorites/:id - 取消收藏
// GET /favorites - 获取收藏列表
// POST /folders - 创建收藏夹
// GET /folders - 获取收藏夹列表
// PATCH /folders/:id - 更新收藏夹
// DELETE /folders/:id - 删除收藏夹
```

---

### 11.6 用户关注系统

**功能描述**：
- 关注/取消关注用户
- 关注列表
- 粉丝列表
- 关注动态推送

**数据库设计**：
```prisma
model Follow {
  id          String   @id @default(uuid())
  followerId  String   @map("follower_id")  // 关注者
  followingId String   @map("following_id") // 被关注者
  createdAt   DateTime @default(now()) @map("created_at")

  follower  User @relation("Follower", fields: [followerId], references: [id])
  following User @relation("Following", fields: [followingId], references: [id])

  @@unique([followerId, followingId]) // 防止重复关注
  @@map("follows")
  @@index([followerId])
  @@index([followingId])
  @@index([createdAt])
}

// 扩展 User 模型
model User {
  // ... 其他字段

  followers     Follow[] @relation("Following") // 粉丝列表
  following     Follow[] @relation("Follower")  // 关注列表
  followerCount Int      @default(0) @map("follower_count")
  followingCount Int     @default(0) @map("following_count")

  // ...
}
```

**API 设计**：
```typescript
// POST /users/:id/follow - 关注用户
// DELETE /users/:id/follow - 取消关注
// GET /users/:id/followers - 获取粉丝列表
// GET /users/:id/following - 获取关注列表
// GET /feed - 获取关注用户的动态
```

**Redis 缓存**：
```typescript
// 缓存关注关系
const cacheKey = `user:${userId}:following`;
await redis.sadd(cacheKey, followingId);

// 检查是否关注
const isFollowing = await redis.sismember(
  `user:${userId}:following`,
  targetUserId
);
```

---

### 11.7 热门话题推荐算法

**功能描述**：
- 热门帖子排行
- 个性化推荐
- 话题趋势分析
- 推荐算法

**算法设计**：

**1. 热度计算公式**
```typescript
// Wilson Score 算法（Reddit 使用）
function calculateHotScore(post: Post): number {
  const upvotes = post.likeCount;
  const downvotes = 0; // 如果有踩的功能
  const n = upvotes + downvotes;

  if (n === 0) return 0;

  const z = 1.96; // 95% 置信度
  const p = upvotes / n;

  const score = (p + z * z / (2 * n) - z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n);

  return score;
}

// 时间衰减算法
function calculateTrendingScore(post: Post): number {
  const now = Date.now();
  const postTime = new Date(post.createdAt).getTime();
  const ageInHours = (now - postTime) / (1000 * 60 * 60);

  const gravity = 1.8; // 重力系数
  const baseScore = post.likeCount + post.commentCount * 2 + post.viewCount * 0.1;

  return baseScore / Math.pow(ageInHours + 2, gravity);
}
```

**2. 数据库设计**
```prisma
model PostScore {
  id           String   @id @default(uuid())
  postId       String   @unique @map("post_id")
  hotScore     Float    @default(0) @map("hot_score")
  trendingScore Float   @default(0) @map("trending_score")
  qualityScore Float    @default(0) @map("quality_score")
  updatedAt    DateTime @updatedAt @map("updated_at")

  post Post @relation(fields: [postId], references: [id])

  @@map("post_scores")
  @@index([hotScore])
  @@index([trendingScore])
}

// 话题表
model Topic {
  id          String   @id @default(uuid())
  name        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(200)
  postCount   Int      @default(0) @map("post_count")
  followerCount Int    @default(0) @map("follower_count")
  isHot       Boolean  @default(false) @map("is_hot")
  createdAt   DateTime @default(now()) @map("created_at")

  posts PostTopic[]

  @@map("topics")
  @@index([postCount])
  @@index([isHot])
}

// 帖子话题关联表
model PostTopic {
  postId  String @map("post_id")
  topicId String @map("topic_id")

  post  Post  @relation(fields: [postId], references: [id])
  topic Topic @relation(fields: [topicId], references: [id])

  @@id([postId, topicId])
  @@map("post_topics")
}
```

**3. 定时任务**
```typescript
@Injectable()
export class ScoreCalculatorService {
  @Cron('*/10 * * * *') // 每 10 分钟执行一次
  async updatePostScores() {
    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近 7 天
        }
      }
    });

    for (const post of posts) {
      const hotScore = calculateHotScore(post);
      const trendingScore = calculateTrendingScore(post);

      await this.prisma.postScore.upsert({
        where: { postId: post.id },
        create: {
          postId: post.id,
          hotScore,
          trendingScore
        },
        update: {
          hotScore,
          trendingScore
        }
      });
    }
  }
}
```

**4. API 设计**
```typescript
// GET /posts/hot - 热门帖子
// GET /posts/trending - 趋势帖子
// GET /topics - 话题列表
// GET /topics/hot - 热门话题
// GET /topics/:id/posts - 话题下的帖子
// GET /recommendations - 个性化推荐（基于用户行为）
```

**5. 个性化推荐**
```typescript
// 基于协同过滤的推荐
@Injectable()
export class RecommendationService {
  async getPersonalizedPosts(userId: string): Promise<Post[]> {
    // 1. 获取用户的历史行为
    const userLikes = await this.getUserLikes(userId);
    const userComments = await this.getUserComments(userId);

    // 2. 找到相似用户
    const similarUsers = await this.findSimilarUsers(userId);

    // 3. 推荐相似用户喜欢的帖子
    const recommendedPosts = await this.getPostsFromSimilarUsers(similarUsers);

    // 4. 结合热门度和新鲜度排序
    return this.rankPosts(recommendedPosts);
  }
}
```

---

### 11.8 性能优化建议

**1. Redis 缓存策略**
```typescript
// 热门帖子缓存（5 分钟）
const hotPosts = await redis.get('posts:hot');
if (!hotPosts) {
  const posts = await this.calculateHotPosts();
  await redis.set('posts:hot', JSON.stringify(posts), 'EX', 300);
}

// 用户关注列表缓存
await redis.sadd(`user:${userId}:following`, followingIds);
```

**2. 数据库索引优化**
- 为 `post_scores` 表的 `hotScore` 和 `trendingScore` 添加索引
- 为 `follows` 表添加复合索引
- 使用 EXPLAIN 分析慢查询

**3. 异步处理**
- 图片压缩使用消息队列（Bull）
- 分数计算使用定时任务
- 通知推送使用 WebSocket

---

## 12. 参考资料

- [NestJS 官方文档](https://docs.nestjs.com/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [JWT 最佳实践](https://jwt.io/introduction)
