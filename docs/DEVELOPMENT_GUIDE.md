# 🛠️ 开发指南

> **版本**: v1.0.0
> **最后更新**: 2024-11-15

本文档为后端开发者提供完整的开发规范、最佳实践和开发流程指导。

---

## 📋 目录

- [开发环境搭建](#开发环境搭建)
- [项目结构详解](#项目结构详解)
- [代码规范](#代码规范)
- [开发流程](#开发流程)
- [常用开发任务](#常用开发任务)
- [调试技巧](#调试技巧)
- [性能优化](#性能优化)
- [安全最佳实践](#安全最佳实践)
- [常见问题](#常见问题)

---

## 🚀 开发环境搭建

### 1. 系统要求

```bash
# 检查版本
node -v    # >= 18.0.0
pnpm -v    # >= 8.0.0
psql --version  # PostgreSQL >= 14
redis-cli --version  # Redis >= 6.0
```

### 2. 克隆项目

```bash
git clone <repository-url>
cd school-forum-back-end
```

### 3. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 如果遇到权限问题
sudo pnpm install --unsafe-perm
```

### 4. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
vim .env
```

**关键配置项**:

```env
# 数据库 (必须)
DATABASE_URL="postgresql://user:password@localhost:5432/school_forum"

# JWT (必须)
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key

# 管理员密钥 (必须)
ADMIN_REGISTRATION_KEY=your-admin-key-min-32-chars

# Redis (推荐)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# CORS (开发环境)
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### 5. 初始化数据库

```bash
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev

# (可选) 填充测试数据
pnpm prisma db seed
```

### 6. 启动开发服务器

```bash
# 启动开发模式 (热重载)
pnpm run start:dev

# 或者调试模式
pnpm run start:debug
```

应用将在 `http://localhost:3000` 启动。

### 7. 验证安装

```bash
# 测试健康检查
curl http://localhost:3000

# 查看 Swagger API 文档
open http://localhost:3000/api/docs

# 运行权限测试
./test-permissions.sh
```

---

## 📁 项目结构详解

```
src/
├── admin/                      # 管理模块
│   ├── admin.controller.ts     # 管理接口控制器
│   ├── admin.service.ts        # 管理业务逻辑
│   └── admin.module.ts         # 管理模块定义
│
├── auth/                       # 认证模块
│   ├── auth.controller.ts      # 认证接口 (登录/注册)
│   ├── auth.service.ts         # 认证业务逻辑
│   ├── auth.module.ts          # 认证模块定义
│   ├── dto/                    # 数据传输对象
│   │   ├── login.dto.ts        # 登录 DTO
│   │   ├── register.dto.ts     # 注册 DTO
│   │   └── register-admin.dto.ts  # 管理员注册 DTO
│   └── strategies/             # Passport 策略
│       ├── jwt.strategy.ts     # JWT 策略
│       └── local.strategy.ts   # 本地策略
│
├── posts/                      # 帖子模块
│   ├── posts.controller.ts     # 帖子接口控制器
│   ├── posts.service.ts        # 帖子业务逻辑
│   └── posts.module.ts         # 帖子模块定义
│
├── comments/                   # 评论模块
├── likes/                      # 点赞模块
├── notifications/              # 通知模块
├── users/                      # 用户模块
├── search/                     # 搜索模块
├── favorites/                  # 收藏模块
├── follows/                    # 关注模块
├── drafts/                     # 草稿模块
├── recommendations/            # 推荐模块
│
├── common/                     # 公共模块
│   ├── decorators/             # 装饰器
│   │   ├── public.decorator.ts    # 公开接口装饰器
│   │   ├── roles.decorator.ts     # 角色装饰器
│   │   └── current-user.decorator.ts  # 当前用户装饰器
│   │
│   ├── guards/                 # 守卫
│   │   ├── jwt-auth.guard.ts   # JWT 认证守卫
│   │   └── roles.guard.ts      # 角色权限守卫
│   │
│   ├── filters/                # 异常过滤器
│   │   └── http-exception.filter.ts
│   │
│   ├── interceptors/           # 拦截器
│   │   └── transform.interceptor.ts
│   │
│   ├── pipes/                  # 管道
│   │   └── validation.pipe.ts
│   │
│   └── middleware/             # 中间件
│       └── logger.middleware.ts  # 请求日志中间件
│
├── prisma/                     # Prisma 服务
│   ├── prisma.service.ts       # Prisma 客户端服务
│   └── prisma.module.ts        # Prisma 模块
│
├── redis/                      # Redis 服务
│   ├── redis.service.ts        # Redis 客户端服务
│   └── redis.module.ts         # Redis 模块
│
├── app.module.ts               # 根模块
└── main.ts                     # 应用入口
```

### 模块职责说明

| 模块 | 职责 | 依赖 |
|-----|------|------|
| `auth` | 用户认证、注册、登录 | `prisma`, `users` |
| `users` | 用户信息管理 | `prisma` |
| `posts` | 帖子 CRUD | `prisma`, `users` |
| `comments` | 评论功能 | `prisma`, `posts`, `users` |
| `likes` | 点赞功能 | `prisma`, `posts`, `comments` |
| `notifications` | 通知推送 | `prisma`, `users` |
| `admin` | 管理员功能 | `prisma`, `users`, `posts` |
| `search` | 全文搜索 | `prisma`, `posts` |
| `favorites` | 收藏功能 | `prisma`, `users`, `posts` |
| `follows` | 关注功能 | `prisma`, `users` |
| `drafts` | 草稿功能 | `prisma`, `users` |
| `recommendations` | 推荐算法 | `prisma`, `redis` |

---

## 📝 代码规范

### 1. TypeScript 规范

#### 类型定义

```typescript
// ✅ 好的做法：使用明确的类型
interface CreatePostDto {
  title: string;
  content: string;
  tags?: string[];
}

// ❌ 避免使用 any
function processData(data: any) { ... }

// ✅ 使用泛型或明确类型
function processData<T>(data: T): T { ... }
```

#### 可选链和空值处理

```typescript
// ✅ 使用可选链
const userName = user?.profile?.name;

// ✅ 使用空值合并
const displayName = userName ?? 'Guest';

// ❌ 避免多层嵌套判断
if (user && user.profile && user.profile.name) {
  const name = user.profile.name;
}
```

### 2. NestJS 规范

#### 控制器 (Controller)

```typescript
@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ✅ 使用装饰器标注路由和权限
  @Public()  // 公开接口
  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.postsService.findAll(query);
  }

  // ✅ 需要登录
  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.create(createPostDto, user.id);
  }

  // ✅ 管理员权限
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
```

#### 服务 (Service)

```typescript
@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ✅ 清晰的方法命名
  async findAll(query: PaginationDto): Promise<PaginatedResponse<Post>> {
    const { page, limit, sortBy } = query;

    // 尝试从缓存获取
    const cacheKey = `posts:${page}:${limit}:${sortBy}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 数据库查询
    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: 'desc' },
        include: { author: true },
      }),
      this.prisma.post.count(),
    ]);

    const result = {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 缓存结果
    await this.redis.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  // ✅ 错误处理
  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: true, comments: true },
    });

    if (!post) {
      throw new NotFoundException(`帖子 ${id} 不存在`);
    }

    return post;
  }
}
```

#### DTO (Data Transfer Object)

```typescript
// ✅ 使用 class-validator 进行验证
export class CreatePostDto {
  @IsString()
  @MinLength(5, { message: '标题至少5个字符' })
  @MaxLength(200, { message: '标题最多200个字符' })
  title: string;

  @IsString()
  @MinLength(10, { message: '内容至少10个字符' })
  @MaxLength(50000, { message: '内容最多50000个字符' })
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}
```

### 3. 数据库规范

#### Prisma 查询

```typescript
// ✅ 使用 include 减少查询次数
const post = await prisma.post.findUnique({
  where: { id },
  include: {
    author: true,
    comments: {
      include: { author: true },
    },
  },
});

// ✅ 使用事务保证数据一致性
await prisma.$transaction(async (tx) => {
  await tx.post.create({ data: postData });
  await tx.notification.create({ data: notificationData });
});

// ✅ 使用索引优化查询
const posts = await prisma.post.findMany({
  where: {
    authorId: userId,  // authorId 应该有索引
  },
  orderBy: { createdAt: 'desc' },
});

// ❌ 避免 N+1 查询
// 不好的做法
const posts = await prisma.post.findMany();
for (const post of posts) {
  post.author = await prisma.user.findUnique({
    where: { id: post.authorId }
  });
}

// ✅ 使用 include 一次性获取
const posts = await prisma.post.findMany({
  include: { author: true },
});
```

### 4. 异步编程规范

```typescript
// ✅ 使用 Promise.all 并发执行
const [user, posts, notifications] = await Promise.all([
  prisma.user.findUnique({ where: { id } }),
  prisma.post.findMany({ where: { authorId: id } }),
  prisma.notification.findMany({ where: { userId: id } }),
]);

// ❌ 避免串行等待
const user = await prisma.user.findUnique({ where: { id } });
const posts = await prisma.post.findMany({ where: { authorId: id } });
const notifications = await prisma.notification.findMany({ where: { userId: id } });
```

### 5. 错误处理规范

```typescript
// ✅ 使用 NestJS 内置异常
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

// 资源不存在
if (!post) {
  throw new NotFoundException('帖子不存在');
}

// 权限不足
if (post.authorId !== userId) {
  throw new ForbiddenException('无权编辑此帖子');
}

// 参数错误
if (!isValidEmail(email)) {
  throw new BadRequestException('邮箱格式不正确');
}

// 未认证
if (!token) {
  throw new UnauthorizedException('请先登录');
}
```

### 6. 日志规范

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  async create(createPostDto: CreatePostDto, userId: string) {
    this.logger.log(`用户 ${userId} 创建帖子`);

    try {
      const post = await this.prisma.post.create({ ... });
      this.logger.log(`帖子 ${post.id} 创建成功`);
      return post;
    } catch (error) {
      this.logger.error(`创建帖子失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

---

## 🔄 开发流程

### 1. 创建新功能模块

```bash
# 使用 NestJS CLI 生成模块
nest g resource <module-name>

# 示例：创建消息模块
nest g resource messages
```

选择：
- REST API
- Generate CRUD entry points? Yes

### 2. 定义数据模型

编辑 `prisma/schema.prisma`:

```prisma
model Message {
  id         String   @id @default(uuid())
  content    String
  senderId   String
  receiverId String
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id])

  @@index([senderId])
  @@index([receiverId])
}
```

运行迁移:

```bash
pnpm prisma migrate dev --name add_messages
```

### 3. 编写 DTO

创建 `src/messages/dto/create-message.dto.ts`:

```typescript
export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @IsString()
  @IsUUID()
  receiverId: string;
}
```

### 4. 实现服务层

编辑 `src/messages/messages.service.ts`:

```typescript
@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto, senderId: string) {
    return this.prisma.message.create({
      data: {
        ...createMessageDto,
        senderId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### 5. 实现控制器

编辑 `src/messages/messages.controller.ts`:

```typescript
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.create(createMessageDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.messagesService.findAll(user.id);
  }
}
```

### 6. 注册模块

编辑 `src/app.module.ts`:

```typescript
@Module({
  imports: [
    // ... 其他模块
    MessagesModule,
  ],
})
export class AppModule {}
```

### 7. 编写测试

创建 `src/messages/messages.service.spec.ts`:

```typescript
describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesService, PrismaService],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a message', async () => {
    const dto = { content: 'Hello', receiverId: 'user-id' };
    const result = await service.create(dto, 'sender-id');
    expect(result.content).toBe('Hello');
  });
});
```

### 8. 提交代码

```bash
# 1. 检查代码质量
pnpm run lint
pnpm run format

# 2. 运行测试
pnpm run test

# 3. 提交代码
git add .
git commit -m "feat: add messages module"
git push origin feature/messages
```

---

## 🧪 调试技巧

### 1. 使用 VSCode 调试

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "start:debug"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

在代码中设置断点，按 F5 启动调试。

### 2. 日志调试

```typescript
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(PostsService.name);

// 普通日志
this.logger.log('这是一条日志');

// 调试日志
this.logger.debug('调试信息', { userId, postId });

// 警告日志
this.logger.warn('警告信息');

// 错误日志
this.logger.error('错误信息', error.stack);
```

### 3. Prisma Studio

```bash
# 打开数据库可视化界面
pnpm prisma studio
```

在浏览器中访问 `http://localhost:5555` 查看数据库数据。

### 4. 使用 curl 测试 API

```bash
# 注册用户
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# 登录获取 Token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.accessToken')

# 使用 Token 访问接口
curl http://localhost:3000/posts \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚡ 性能优化

### 1. 数据库查询优化

```typescript
// ✅ 使用索引
// schema.prisma
model Post {
  // ...
  @@index([authorId])
  @@index([createdAt])
  @@index([viewCount])
}

// ✅ 使用分页
async findAll(page: number, limit: number) {
  return this.prisma.post.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}

// ✅ 只查询需要的字段
async findAll() {
  return this.prisma.post.findMany({
    select: {
      id: true,
      title: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });
}
```

### 2. Redis 缓存

```typescript
async findHotPosts(): Promise<Post[]> {
  const cacheKey = 'hot:posts';

  // 尝试从缓存获取
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 数据库查询
  const posts = await this.prisma.post.findMany({
    orderBy: { viewCount: 'desc' },
    take: 10,
  });

  // 缓存 5 分钟
  await this.redis.set(cacheKey, JSON.stringify(posts), 300);

  return posts;
}
```

### 3. 并发优化

```typescript
// ✅ 并发执行独立任务
const [post, comments, likes] = await Promise.all([
  this.prisma.post.findUnique({ where: { id } }),
  this.prisma.comment.findMany({ where: { postId: id } }),
  this.prisma.like.count({ where: { postId: id } }),
]);
```

---

## 🔒 安全最佳实践

### 1. 密码加密

```typescript
import * as bcrypt from 'bcrypt';

// 加密密码
const hashedPassword = await bcrypt.hash(password, 10);

// 验证密码
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. JWT 最佳实践

```typescript
// ✅ 短有效期的 Access Token
JWT_EXPIRES_IN=15m

// ✅ 长有效期的 Refresh Token
JWT_REFRESH_EXPIRES_IN=7d

// ✅ Token 包含最少信息
const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,
};
```

### 3. 输入验证

```typescript
// ✅ 使用 DTO 验证所有输入
export class CreatePostDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;
}

// ✅ 自定义验证器
@ValidatorConstraint({ name: 'isNotProfanity', async: false })
export class IsNotProfanityConstraint implements ValidatorConstraintInterface {
  validate(text: string) {
    return !containsProfanity(text);
  }
}
```

### 4. 权限控制

```typescript
// ✅ 使用守卫保护路由
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
async remove(@Param('id') id: string) { ... }

// ✅ 验证资源所有权
async update(id: string, dto: UpdatePostDto, userId: string) {
  const post = await this.prisma.post.findUnique({ where: { id } });

  if (post.authorId !== userId) {
    throw new ForbiddenException('无权编辑此帖子');
  }

  return this.prisma.post.update({ where: { id }, data: dto });
}
```

---

## ❓ 常见问题

### Q1: 如何添加新的环境变量?

1. 在 `.env` 中添加变量
2. 在 `.env.example` 中添加示例
3. 在代码中使用 `ConfigService` 读取

```typescript
constructor(private config: ConfigService) {}

const apiKey = this.config.get<string>('API_KEY');
```

### Q2: 如何修改数据库结构?

1. 编辑 `prisma/schema.prisma`
2. 运行迁移: `pnpm prisma migrate dev --name <migration-name>`
3. 生成客户端: `pnpm prisma generate`

### Q3: 如何处理文件上传?

参考 `src/upload` 模块的实现，使用 `@nestjs/platform-express` 的 `FileInterceptor`。

### Q4: 如何实现实时功能?

使用 WebSocket，参考 `src/notifications` 模块的 Gateway 实现。

### Q5: 如何运行单个测试文件?

```bash
pnpm run test src/posts/posts.service.spec.ts
```

---

## 📚 相关文档

- [架构设计文档](./01-design/architecture-design.md)
- [API 接口文档](./02-implementation/api-documentation.md)
- [数据库使用指南](./02-implementation/database-guide.md)
- [前端 API 对接指南](./FRONTEND_API_GUIDE.md)

---

## 🤝 参与贡献

遵循以下步骤贡献代码:

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 编写代码并通过测试
4. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
5. 推送到分支 (`git push origin feature/AmazingFeature`)
6. 提交 Pull Request

---

<div align="center">

**🛠️ 快乐编码！**

Made with ❤️ by 后端开发团队

</div>
