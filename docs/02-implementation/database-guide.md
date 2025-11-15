# Prisma 数据库迁移与使用指南

## 📋 目录

1. [Prisma 简介](#1-prisma-简介)
2. [初始化设置](#2-初始化设置)
3. [数据库迁移](#3-数据库迁移)
4. [常用命令](#4-常用命令)
5. [数据填充](#5-数据填充)
6. [最佳实践](#6-最佳实践)
7. [扩展功能数据模型](#7-扩展功能数据模型)
8. [参考资料](#8-参考资料)

## 1. Prisma 简介

Prisma 是一个现代化的 TypeScript ORM，提供以下特性：

- **类型安全**: 自动生成的 TypeScript 类型
- **直观的 API**: 易于使用的查询构建器
- **数据库迁移**: 版本控制的数据库 schema
- **可视化管理**: Prisma Studio 数据库管理工具

## 2. 初始化设置

### 2.1 安装 Prisma

```bash
# 安装 Prisma CLI (开发依赖)
pnpm add -D prisma

# 安装 Prisma Client (运行时依赖)
pnpm add @prisma/client
```

### 2.2 配置数据库连接

编辑 `.env` 文件，配置 PostgreSQL 连接字符串：

```env
# 本地开发环境
DATABASE_URL="postgresql://username:password@localhost:5432/school_forum?schema=public"

# 阿里云 RDS PostgreSQL (生产环境)
# DATABASE_URL="postgresql://username:password@rm-xxxxx.pg.rds.aliyuncs.com:5432/school_forum?schema=public"
```

连接字符串格式说明：
```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?schema=[schema名]
```

### 2.3 验证配置

```bash
# 测试数据库连接
pnpm prisma db pull --force
```

## 3. 数据库迁移

### 3.1 创建初始迁移

项目首次初始化时，创建第一个迁移：

```bash
# 生成并应用初始迁移
pnpm prisma migrate dev --name init

# 这个命令会：
# 1. 根据 schema.prisma 创建 SQL 迁移文件
# 2. 在数据库中执行迁移
# 3. 生成 Prisma Client
```

迁移文件会保存在 `prisma/migrations/` 目录下：

```
prisma/migrations/
└── 20251115000000_init/
    └── migration.sql
```

### 3.2 修改 Schema 后的迁移

当你修改了 `schema.prisma` 文件后：

```bash
# 创建并应用新的迁移
pnpm prisma migrate dev --name add_user_fields

# 例如：添加用户字段
# pnpm prisma migrate dev --name add_user_phone_field
```

### 3.3 查看迁移状态

```bash
# 查看迁移历史
pnpm prisma migrate status

# 查看待应用的迁移
pnpm prisma migrate resolve
```

### 3.4 生产环境部署迁移

在生产环境中，使用 `migrate deploy` 命令：

```bash
# 应用所有待执行的迁移（不生成新迁移）
pnpm prisma migrate deploy

# 推荐在 CI/CD 部署流程中使用
```

**注意事项**：
- ⚠️ 生产环境应该只使用 `migrate deploy`，不要使用 `migrate dev`
- ⚠️ 部署前先在测试环境验证迁移
- ⚠️ 做好数据库备份

## 4. 常用命令

### 4.1 Prisma Client

```bash
# 生成 Prisma Client (在修改 schema 后需要执行)
pnpm prisma generate

# Prisma Client 会自动生成到 node_modules/@prisma/client
```

### 4.2 Prisma Studio

Prisma Studio 是一个可视化的数据库管理界面：

```bash
# 启动 Prisma Studio
pnpm prisma studio

# 默认在 http://localhost:5555 打开
```

功能：
- 浏览数据库表和数据
- 添加、编辑、删除记录
- 执行查询
- 查看关联关系

### 4.3 数据库操作

```bash
# 重置数据库（删除所有数据并重新迁移）
pnpm prisma migrate reset

# 强制同步 schema 到数据库（仅开发环境）
pnpm prisma db push

# 从现有数据库生成 schema
pnpm prisma db pull

# 验证 schema 语法
pnpm prisma validate

# 格式化 schema 文件
pnpm prisma format
```

### 4.4 种子数据

```bash
# 执行数据填充
pnpm prisma db seed
```

## 5. 数据填充

### 5.1 创建 Seed 文件

创建 `prisma/seed.ts` 文件：

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充数据...');

  // 清空现有数据（可选）
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ 已清空现有数据');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      nickname: '管理员',
      role: 'ADMIN',
      bio: '系统管理员账号',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      username: 'zhangsan',
      email: 'zhangsan@example.com',
      password: hashedPassword,
      studentId: '2021001',
      nickname: '张三',
      role: 'STUDENT',
      bio: '热爱编程的大三学生',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      username: 'lisi',
      email: 'lisi@example.com',
      password: hashedPassword,
      studentId: '2021002',
      nickname: '李四',
      role: 'STUDENT',
      bio: '喜欢音乐和电影',
    },
  });

  console.log('✅ 已创建测试用户');

  // 创建测试帖子
  const post1 = await prisma.post.create({
    data: {
      title: '欢迎来到校园论坛！',
      content: `
# 欢迎

这是校园论坛的第一篇帖子。

## 功能介绍

- 发布帖子
- 评论互动
- 点赞收藏
- 搜索功能

期待大家的参与！
      `,
      tags: ['公告', '欢迎'],
      authorId: admin.id,
      viewCount: 150,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: '分享一些学习资源',
      content: '推荐几个不错的编程学习网站...',
      tags: ['学习', '资源分享'],
      authorId: student1.id,
      viewCount: 88,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: '周末有组队打球的吗？',
      content: '周六下午想打篮球，有一起的吗？',
      tags: ['运动', '校园生活'],
      authorId: student2.id,
      viewCount: 42,
    },
  });

  console.log('✅ 已创建测试帖子');

  // 创建测试评论
  await prisma.comment.create({
    data: {
      content: '感谢分享，很有用！',
      postId: post1.id,
      authorId: student1.id,
    },
  });

  const parentComment = await prisma.comment.create({
    data: {
      content: '这些资源太棒了！',
      postId: post2.id,
      authorId: student2.id,
    },
  });

  // 创建二级评论（回复）
  await prisma.comment.create({
    data: {
      content: '同感，已经收藏了',
      postId: post2.id,
      authorId: student1.id,
      parentId: parentComment.id,
    },
  });

  console.log('✅ 已创建测试评论');

  // 创建测试点赞
  await prisma.like.create({
    data: {
      userId: student1.id,
      targetId: post1.id,
      targetType: 'POST',
    },
  });

  await prisma.like.create({
    data: {
      userId: student2.id,
      targetId: post1.id,
      targetType: 'POST',
    },
  });

  // 更新帖子点赞数
  await prisma.post.update({
    where: { id: post1.id },
    data: { likeCount: 2 },
  });

  console.log('✅ 已创建测试点赞');

  // 创建测试通知
  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: 'COMMENT',
      title: '新评论通知',
      content: '张三 评论了你的帖子',
      relatedId: post1.id,
    },
  });

  console.log('✅ 已创建测试通知');

  console.log('🎉 数据填充完成！');
  console.log('\n测试账号：');
  console.log('管理员: admin@example.com / password123');
  console.log('学生1: zhangsan@example.com / password123');
  console.log('学生2: lisi@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ 数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 5.2 配置 package.json

在 `package.json` 中添加 seed 配置：

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "scripts": {
    "db:seed": "prisma db seed"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "@types/node": "^22.10.7"
  }
}
```

### 5.3 执行数据填充

```bash
# 安装 ts-node (如果还没安装)
pnpm add -D ts-node

# 执行 seed
pnpm prisma db seed
# 或
pnpm run db:seed
```

## 6. 最佳实践

### 6.1 开发流程

```bash
# 1. 修改 schema.prisma
# 2. 创建迁移
pnpm prisma migrate dev --name descriptive_name

# 3. 提交迁移文件到 Git
git add prisma/migrations
git commit -m "feat: add user profile fields"
```

### 6.2 团队协作

**拉取最新代码后**：

```bash
# 1. 拉取代码
git pull

# 2. 安装依赖
pnpm install

# 3. 应用迁移
pnpm prisma migrate dev

# 4. 生成 Prisma Client
pnpm prisma generate
```

### 6.3 生产环境部署

```bash
# 部署流程
pnpm install --prod
pnpm prisma generate
pnpm prisma migrate deploy
pnpm run build
pnpm run start:prod
```

### 6.4 Schema 设计建议

1. **使用有意义的命名**
   ```prisma
   // 好
   model Post { ... }

   // 不好
   model P { ... }
   ```

2. **添加索引优化查询**
   ```prisma
   @@index([authorId, createdAt])
   @@index([tags])
   ```

3. **使用枚举类型**
   ```prisma
   enum Role {
     STUDENT
     TEACHER
     ADMIN
   }
   ```

4. **合理使用级联删除**
   ```prisma
   author User @relation(fields: [authorId], references: [id], onDelete: Cascade)
   ```

5. **添加唯一约束**
   ```prisma
   @@unique([userId, targetId, targetType])
   ```

### 6.5 常见问题

**Q: 迁移失败怎么办？**

```bash
# 1. 查看迁移状态
pnpm prisma migrate status

# 2. 如果是开发环境，可以重置
pnpm prisma migrate reset

# 3. 如果是生产环境，手动修复后标记为已应用
pnpm prisma migrate resolve --applied "migration_name"
```

**Q: 如何回滚迁移？**

Prisma 不支持自动回滚，需要手动操作：

1. 创建新的迁移来撤销更改
2. 或者在数据库中手动执行回滚 SQL

**Q: 生产环境数据库结构不一致？**

```bash
# 对比当前数据库和 schema
pnpm prisma db pull

# 查看差异并决定是应用迁移还是修改 schema
```

### 6.6 性能优化

1. **使用连接池**

```typescript
// prisma/prisma.service.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});
```

2. **批量操作**

```typescript
// 使用 createMany 而不是多次 create
await prisma.post.createMany({
  data: [
    { title: 'Post 1', content: '...' },
    { title: 'Post 2', content: '...' },
  ],
});
```

3. **查询优化**

```typescript
// 使用 select 只查询需要的字段
await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    email: true,
  },
});

// 使用 include 预加载关联数据
await prisma.post.findMany({
  include: {
    author: true,
    comments: true,
  },
});
```

## 7. 扩展功能数据模型

系统包含以下扩展功能的数据模型，已在 `schema.prisma` 中定义：

### 7.1 草稿功能

```prisma
model PostDraft {
  id        String    @id @default(uuid())
  title     String?   @db.VarChar(200)
  content   String?   @db.Text
  images    String[]
  tags      String[]
  authorId  String    @map("author_id")
  postId    String?   @map("post_id")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  author User  @relation(fields: [authorId], references: [id])
  post   Post? @relation(fields: [postId], references: [id])

  @@map("post_drafts")
  @@index([authorId, updatedAt])
}
```

**使用示例**：

```typescript
// 保存草稿
await prisma.postDraft.upsert({
  where: { id: draftId },
  create: {
    title: '草稿标题',
    content: '草稿内容...',
    authorId: userId,
  },
  update: {
    title: '更新的标题',
    content: '更新的内容...',
  },
});

// 获取用户的所有草稿
const drafts = await prisma.postDraft.findMany({
  where: { authorId: userId },
  orderBy: { updatedAt: 'desc' },
});
```

### 7.2 收藏功能

```prisma
model Folder {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  name        String   @db.VarChar(50)
  description String?  @db.VarChar(200)
  isDefault   Boolean  @default(false) @map("is_default")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user      User       @relation(fields: [userId], references: [id])
  favorites Favorite[]

  @@map("folders")
  @@index([userId])
}

model Favorite {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  postId    String   @map("post_id")
  folderId  String   @map("folder_id")
  note      String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")

  user   User   @relation(fields: [userId], references: [id])
  post   Post   @relation(fields: [postId], references: [id])
  folder Folder @relation(fields: [folderId], references: [id])

  @@unique([userId, postId])
  @@map("favorites")
  @@index([userId, createdAt])
  @@index([postId])
}
```

**使用示例**：

```typescript
// 创建收藏夹
const folder = await prisma.folder.create({
  data: {
    name: '技术文章',
    userId: userId,
    isDefault: false,
  },
});

// 收藏帖子
await prisma.favorite.create({
  data: {
    userId: userId,
    postId: postId,
    folderId: folder.id,
    note: '很有用的文章',
  },
});

// 获取收藏列表
const favorites = await prisma.favorite.findMany({
  where: { userId: userId },
  include: {
    post: {
      include: {
        author: true,
      },
    },
    folder: true,
  },
});
```

### 7.3 关注系统

```prisma
model Follow {
  id          String   @id @default(uuid())
  followerId  String   @map("follower_id")
  followingId String   @map("following_id")
  createdAt   DateTime @default(now()) @map("created_at")

  follower  User @relation("Follower", fields: [followerId], references: [id])
  following User @relation("Following", fields: [followingId], references: [id])

  @@unique([followerId, followingId])
  @@map("follows")
  @@index([followerId])
  @@index([followingId])
  @@index([createdAt])
}

// 需要在 User 模型中添加
model User {
  // ... 其他字段

  followers      Follow[] @relation("Following")
  following      Follow[] @relation("Follower")
  followerCount  Int      @default(0) @map("follower_count")
  followingCount Int      @default(0) @map("following_count")
}
```

**使用示例**：

```typescript
// 关注用户
await prisma.follow.create({
  data: {
    followerId: currentUserId,
    followingId: targetUserId,
  },
});

// 同时更新计数
await prisma.user.update({
  where: { id: targetUserId },
  data: { followerCount: { increment: 1 } },
});

// 获取粉丝列表
const followers = await prisma.follow.findMany({
  where: { followingId: userId },
  include: {
    follower: {
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
      },
    },
  },
});
```

### 7.4 话题系统

```prisma
model Topic {
  id            String   @id @default(uuid())
  name          String   @unique @db.VarChar(50)
  description   String?  @db.VarChar(200)
  postCount     Int      @default(0) @map("post_count")
  followerCount Int      @default(0) @map("follower_count")
  isHot         Boolean  @default(false) @map("is_hot")
  createdAt     DateTime @default(now()) @map("created_at")

  posts PostTopic[]

  @@map("topics")
  @@index([postCount])
  @@index([isHot])
}

model PostTopic {
  postId  String @map("post_id")
  topicId String @map("topic_id")

  post  Post  @relation(fields: [postId], references: [id])
  topic Topic @relation(fields: [topicId], references: [id])

  @@id([postId, topicId])
  @@map("post_topics")
}
```

**使用示例**：

```typescript
// 创建话题
const topic = await prisma.topic.create({
  data: {
    name: '校园生活',
    description: '分享校园生活点滴',
  },
});

// 关联帖子到话题
await prisma.postTopic.create({
  data: {
    postId: postId,
    topicId: topic.id,
  },
});

// 获取话题下的帖子
const topicPosts = await prisma.postTopic.findMany({
  where: { topicId: topic.id },
  include: {
    post: {
      include: {
        author: true,
      },
    },
  },
});
```

### 7.5 推荐算法评分

```prisma
model PostScore {
  id            String   @id @default(uuid())
  postId        String   @unique @map("post_id")
  hotScore      Float    @default(0) @map("hot_score")
  trendingScore Float    @default(0) @map("trending_score")
  qualityScore  Float    @default(0) @map("quality_score")
  updatedAt     DateTime @updatedAt @map("updated_at")

  post Post @relation(fields: [postId], references: [id])

  @@map("post_scores")
  @@index([hotScore])
  @@index([trendingScore])
}
```

**使用示例**：

```typescript
// 计算并更新帖子评分
const hotScore = calculateHotScore(post);
const trendingScore = calculateTrendingScore(post);

await prisma.postScore.upsert({
  where: { postId: post.id },
  create: {
    postId: post.id,
    hotScore,
    trendingScore,
  },
  update: {
    hotScore,
    trendingScore,
  },
});

// 获取热门帖子
const hotPosts = await prisma.postScore.findMany({
  orderBy: { hotScore: 'desc' },
  take: 20,
  include: {
    post: {
      include: {
        author: true,
      },
    },
  },
});
```

### 7.6 在线状态（WebSocket）

```prisma
model UserOnlineStatus {
  id       String   @id @default(uuid())
  userId   String   @unique @map("user_id")
  isOnline Boolean  @default(false) @map("is_online")
  lastSeen DateTime @map("last_seen")
  socketId String?  @map("socket_id")

  user User @relation(fields: [userId], references: [id])

  @@map("user_online_status")
}
```

**使用示例**：

```typescript
// 用户上线
await prisma.userOnlineStatus.upsert({
  where: { userId: userId },
  create: {
    userId: userId,
    isOnline: true,
    lastSeen: new Date(),
    socketId: socket.id,
  },
  update: {
    isOnline: true,
    lastSeen: new Date(),
    socketId: socket.id,
  },
});

// 用户下线
await prisma.userOnlineStatus.update({
  where: { userId: userId },
  data: {
    isOnline: false,
    lastSeen: new Date(),
    socketId: null,
  },
});
```

### 7.7 图片信息

```prisma
model PostImage {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  original  String   @db.VarChar(500)
  large     String   @db.VarChar(500)
  medium    String   @db.VarChar(500)
  thumbnail String   @db.VarChar(500)
  width     Int
  height    Int
  size      Int
  createdAt DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id])

  @@map("post_images")
  @@index([postId])
}
```

**使用示例**：

```typescript
// 保存处理后的图片信息
await prisma.postImage.create({
  data: {
    postId: postId,
    original: 'https://cdn.example.com/original.jpg',
    large: 'https://cdn.example.com/large.webp',
    medium: 'https://cdn.example.com/medium.webp',
    thumbnail: 'https://cdn.example.com/thumb.webp',
    width: 1920,
    height: 1080,
    size: 102400,
  },
});
```

### 7.8 迁移扩展功能

如果需要添加这些扩展功能，执行以下步骤：

```bash
# 1. 确保 schema.prisma 包含上述模型定义

# 2. 创建迁移
pnpm prisma migrate dev --name add_extended_features

# 3. 生成 Prisma Client
pnpm prisma generate

# 4. 更新 seed 文件以包含测试数据（可选）
# 编辑 prisma/seed.ts

# 5. 重新填充数据（可选）
pnpm prisma db seed
```

**注意事项**：
- 扩展功能的迁移应该是增量的，不要影响现有数据
- 生产环境部署前务必先在测试环境验证
- 某些功能（如在线状态）可以选择使用 Redis 而不是数据库存储

## 8. 参考资料

- [Prisma 官方文档](https://www.prisma.io/docs/)
- [Prisma Schema 参考](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [数据库迁移最佳实践](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-15
