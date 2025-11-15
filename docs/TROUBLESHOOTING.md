# 🔧 故障排查指南

> **版本**: v1.0.0
> **最后更新**: 2024-11-15

本文档提供常见问题的诊断和解决方案，帮助你快速定位和解决开发、部署过程中遇到的问题。

---

## 📋 目录

- [环境相关问题](#环境相关问题)
- [数据库问题](#数据库问题)
- [认证授权问题](#认证授权问题)
- [CORS 跨域问题](#cors-跨域问题)
- [性能问题](#性能问题)
- [部署问题](#部署问题)
- [第三方服务问题](#第三方服务问题)
- [日志分析](#日志分析)

---

## 🌍 环境相关问题

### ❌ 问题1: `pnpm install` 失败

**症状**:
```bash
ERR_PNPM_NO_MATCHING_VERSION  No matching version found for ...
```

**诊断步骤**:
```bash
# 1. 检查 Node.js 版本
node -v  # 应该 >= 18.0.0

# 2. 检查 pnpm 版本
pnpm -v  # 应该 >= 8.0.0

# 3. 清理缓存
pnpm store prune
rm -rf node_modules pnpm-lock.yaml

# 4. 重新安装
pnpm install
```

**解决方案**:
- 升级 Node.js: `nvm install 18` 或 `nvm install 20`
- 升级 pnpm: `npm install -g pnpm@latest`
- 如果是网络问题，切换国内镜像:
  ```bash
  pnpm config set registry https://registry.npmmirror.com
  ```

---

### ❌ 问题2: 端口被占用

**症状**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**诊断步骤**:
```bash
# 1. 查看占用 3000 端口的进程
lsof -i :3000

# 或者 (Linux)
netstat -tulpn | grep 3000
```

**解决方案**:
```bash
# 方案1: 杀死占用进程
kill -9 <PID>

# 方案2: 修改应用端口
# 编辑 .env 文件
PORT=3001

# 方案3: 使用不同的端口启动
PORT=3001 pnpm run start:dev
```

---

### ❌ 问题3: 环境变量未生效

**症状**:
```
ConfigService: Unable to read value for key "DATABASE_URL"
```

**诊断步骤**:
```bash
# 1. 检查 .env 文件是否存在
ls -la .env

# 2. 检查环境变量内容
cat .env | grep DATABASE_URL

# 3. 检查是否有语法错误
# 注意：环境变量不能有空格
# ❌ DATABASE_URL = "..."
# ✅ DATABASE_URL="..."
```

**解决方案**:
```bash
# 1. 确保 .env 文件在项目根目录
cp .env.example .env

# 2. 检查 ConfigModule 配置
# src/app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
})

# 3. 重启应用
pnpm run start:dev
```

---

## 🗄️ 数据库问题

### ❌ 问题4: 无法连接数据库

**症状**:
```
PrismaClientInitializationError:
Can't reach database server at `localhost:5432`
```

**诊断步骤**:
```bash
# 1. 检查 PostgreSQL 是否运行
pg_isready

# 或者
ps aux | grep postgres

# 2. 检查端口是否监听
lsof -i :5432

# 3. 测试连接
psql -U postgres -h localhost -p 5432

# 4. 检查 DATABASE_URL 格式
# 正确格式: postgresql://user:password@host:port/database
echo $DATABASE_URL
```

**解决方案**:
```bash
# 方案1: 启动 PostgreSQL
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Docker
docker start postgres-container

# 方案2: 检查防火墙
sudo ufw allow 5432

# 方案3: 检查 pg_hba.conf 配置
# 确保允许本地连接
# /etc/postgresql/14/main/pg_hba.conf
# local   all             all                                     trust
# host    all             all             127.0.0.1/32            md5
```

---

### ❌ 问题5: Prisma 迁移失败

**症状**:
```
Error: Migration `20241115_xxx` failed to apply cleanly
```

**诊断步骤**:
```bash
# 1. 查看迁移状态
pnpm prisma migrate status

# 2. 查看数据库当前状态
pnpm prisma db pull

# 3. 检查迁移文件
cat prisma/migrations/20241115_xxx/migration.sql
```

**解决方案**:
```bash
# 方案1: 重置数据库 (开发环境)
pnpm prisma migrate reset

# 方案2: 解决冲突后重试
pnpm prisma migrate resolve --applied <migration-name>
pnpm prisma migrate deploy

# 方案3: 生产环境回滚
pnpm prisma migrate resolve --rolled-back <migration-name>

# 方案4: 从头开始 (仅开发环境)
# ⚠️ 警告：会删除所有数据
rm -rf prisma/migrations
dropdb school_forum
createdb school_forum
pnpm prisma migrate dev --name init
```

---

### ❌ 问题6: Prisma Client 未同步

**症状**:
```
Property 'newField' does not exist on type 'User'
```

**诊断步骤**:
```bash
# 1. 检查 schema.prisma 是否已更新
cat prisma/schema.prisma | grep newField

# 2. 检查 Prisma Client 版本
pnpm prisma -v
```

**解决方案**:
```bash
# 1. 重新生成 Prisma Client
pnpm prisma generate

# 2. 如果还是不行，清理缓存
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
pnpm install
pnpm prisma generate

# 3. 重启 TypeScript 服务器 (VSCode)
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

---

## 🔐 认证授权问题

### ❌ 问题7: Token 验证失败

**症状**:
```
401 Unauthorized
```

**诊断步骤**:
```bash
# 1. 检查 Token 格式
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq

# 2. 检查 Token 是否过期
# 查看 exp 字段 (Unix 时间戳)

# 3. 检查 JWT_SECRET 是否一致
cat .env | grep JWT_SECRET
```

**解决方案**:
```typescript
// 1. 确保 Token 正确传递
// ✅ 正确
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// ❌ 错误
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 2. 检查 JWT 策略配置
// src/auth/strategies/jwt.strategy.ts
constructor(private configService: ConfigService) {
  super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,  // ← 不要忽略过期
    secretOrKey: configService.get<string>('JWT_SECRET'),
  });
}

// 3. 使用 Refresh Token 获取新的 Access Token
POST /auth/refresh
{
  "refreshToken": "..."
}
```

---

### ❌ 问题8: 权限验证失败 (403)

**症状**:
```
403 Forbidden: 权限不足
```

**诊断步骤**:
```bash
# 1. 检查用户角色
# 解码 Token 查看 role 字段
echo $TOKEN | jwt decode -

# 2. 检查接口权限要求
# 查看控制器装饰器
grep -n "@Roles" src/admin/admin.controller.ts

# 3. 检查守卫是否生效
# 查看日志
```

**解决方案**:
```typescript
// 1. 确保接口有正确的装饰器
@Roles(Role.ADMIN)  // ← 需要 ADMIN 角色
@Get('admin/users')
async getUsers() { ... }

// 2. 确保守卫已注册
// src/app.module.ts
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
]

// 3. 对于公开接口，使用 @Public()
@Public()  // ← 无需认证
@Get('posts')
async findAll() { ... }

// 4. 测试权限
# 运行权限测试脚本
./test-permissions.sh
```

---

### ❌ 问题9: 管理员注册失败

**症状**:
```
403 Forbidden: 管理员注册密钥无效
```

**诊断步骤**:
```bash
# 1. 检查环境变量
cat .env | grep ADMIN_REGISTRATION_KEY

# 2. 检查请求参数
curl -X POST http://localhost:3000/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{"adminKey":"<key>"}' -v
```

**解决方案**:
```bash
# 1. 确保 .env 中配置了密钥
ADMIN_REGISTRATION_KEY=dev-admin-key-2024-change-in-production-secure-key-12345

# 2. 重启应用加载新配置
pnpm run start:dev

# 3. 使用正确的密钥注册
curl -X POST http://localhost:3000/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin@123456",
    "adminKey": "dev-admin-key-2024-change-in-production-secure-key-12345"
  }'
```

---

## 🌐 CORS 跨域问题

### ❌ 问题10: CORS 错误

**症状**:
```
Access to XMLHttpRequest at 'http://localhost:3000/posts' from origin
'http://localhost:5173' has been blocked by CORS policy
```

**诊断步骤**:
```bash
# 1. 检查 CORS 配置
cat .env | grep CORS_ORIGIN

# 2. 检查请求来源
# 浏览器开发者工具 -> Network -> 查看 Origin 请求头

# 3. 检查预检请求
curl -X OPTIONS http://localhost:3000/posts \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**解决方案**:
```typescript
// 1. 确保前端地址在 CORS_ORIGIN 中
// .env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

// 2. 检查 main.ts 中的 CORS 配置
// src/main.ts
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);  // 允许 Postman 等工具
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // 允许发送 Cookie
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// 3. 前端确保正确设置请求头
fetch('http://localhost:3000/posts', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  credentials: 'include',  // 如果需要发送 Cookie
});

// 4. 重启应用
pnpm run start:dev
```

---

## ⚡ 性能问题

### ❌ 问题11: 接口响应慢

**症状**:
```
接口响应时间超过 2 秒
```

**诊断步骤**:
```bash
# 1. 使用 curl 测试响应时间
time curl http://localhost:3000/posts

# 2. 查看日志中的响应时间
# 请求日志中间件会记录每个请求的耗时

# 3. 检查数据库查询
# 启用 Prisma 日志
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"

# 4. 使用 Prisma Studio 查看数据量
pnpm prisma studio
```

**解决方案**:
```typescript
// 1. 添加分页
async findAll(page: number, limit: number) {
  return this.prisma.post.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}

// 2. 添加缓存
async findHotPosts() {
  const cacheKey = 'hot:posts';
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const posts = await this.prisma.post.findMany(...);
  await this.redis.set(cacheKey, JSON.stringify(posts), 300);
  return posts;
}

// 3. 优化查询，只查询需要的字段
async findAll() {
  return this.prisma.post.findMany({
    select: {
      id: true,
      title: true,
      createdAt: true,
      author: {
        select: { id: true, username: true, avatar: true },
      },
    },
  });
}

// 4. 添加数据库索引
// prisma/schema.prisma
model Post {
  // ...
  @@index([authorId])
  @@index([createdAt])
  @@index([viewCount])
}

// 运行迁移
pnpm prisma migrate dev --name add_indexes
```

---

### ❌ 问题12: Redis 连接失败

**症状**:
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**诊断步骤**:
```bash
# 1. 检查 Redis 是否运行
redis-cli ping
# 应该返回 PONG

# 2. 检查 Redis 配置
cat .env | grep REDIS

# 3. 测试连接
redis-cli -h 127.0.0.1 -p 6379
```

**解决方案**:
```bash
# 方案1: 启动 Redis
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine

# 方案2: 如果不需要 Redis，禁用相关功能
# .env
CACHE_ENABLED=false

# 方案3: 检查 Redis 密码
# .env
REDIS_PASSWORD=your-redis-password
```

---

## 🚀 部署问题

### ❌ 问题13: 编译失败

**症状**:
```
error TS2304: Cannot find name 'xxx'
```

**诊断步骤**:
```bash
# 1. 清理构建产物
rm -rf dist

# 2. 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 3. 重新生成 Prisma Client
pnpm prisma generate

# 4. 尝试编译
pnpm run build
```

**解决方案**:
```bash
# 1. 检查 TypeScript 配置
cat tsconfig.json

# 2. 确保所有类型定义都已安装
pnpm add -D @types/node @types/express

# 3. 检查导入路径是否正确
# ❌ import { User } from 'src/users/entities/user.entity';
# ✅ import { User } from '../users/entities/user.entity';

# 4. 如果是 Prisma 类型问题
pnpm prisma generate
pnpm run build
```

---

### ❌ 问题14: PM2 启动失败

**症状**:
```
Error: Cannot find module './dist/main'
```

**诊断步骤**:
```bash
# 1. 检查是否已编译
ls -la dist/

# 2. 检查 main.js 是否存在
ls -la dist/main.js

# 3. 查看 PM2 日志
pm2 logs school-forum
```

**解决方案**:
```bash
# 1. 确保先编译
pnpm run build

# 2. 使用正确的启动命令
pm2 start dist/main.js --name school-forum

# 或使用 ecosystem 配置
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'school-forum',
    script: './dist/main.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
  }],
};

pm2 start ecosystem.config.js
```

---

### ❌ 问题15: 生产环境数据库迁移失败

**症状**:
```
Migration engine error:
Failed to connect to the database
```

**诊断步骤**:
```bash
# 1. 检查生产环境 DATABASE_URL
echo $DATABASE_URL

# 2. 测试数据库连接
psql $DATABASE_URL

# 3. 检查数据库防火墙规则
# 确保应用服务器 IP 在白名单中
```

**解决方案**:
```bash
# 1. 使用正确的生产环境连接串
export DATABASE_URL="postgresql://user:pass@rds-xxx.pg.rds.aliyuncs.com:5432/dbname"

# 2. 运行迁移
pnpm prisma migrate deploy

# 3. 如果是 SSL 问题
# DATABASE_URL 添加 SSL 参数
DATABASE_URL="postgresql://...?sslmode=require"

# 4. 如果是网络问题
# 检查安全组规则
# 添加应用服务器 IP 到 RDS 白名单
```

---

## 🔌 第三方服务问题

### ❌ 问题16: OSS 上传失败

**症状**:
```
Error: AccessDenied: The OSS Access Key Id you provided does not exist
```

**诊断步骤**:
```bash
# 1. 检查 OSS 配置
cat .env | grep OSS

# 2. 检查 Access Key 是否正确
# 登录阿里云控制台验证

# 3. 检查权限
# 确保 Access Key 有 OSS 操作权限
```

**解决方案**:
```bash
# 1. 更新 Access Key
# .env
OSS_ACCESS_KEY_ID=LTAI5t...
OSS_ACCESS_KEY_SECRET=xxx...

# 2. 检查 Bucket 配置
OSS_BUCKET=school-forum-files
OSS_REGION=oss-cn-hangzhou

# 3. 测试上传
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg"
```

---

## 📊 日志分析

### 查看应用日志

```bash
# 开发环境
# 日志直接输出到控制台

# 生产环境 (PM2)
pm2 logs school-forum

# 查看最近 100 行日志
pm2 logs school-forum --lines 100

# 查看错误日志
pm2 logs school-forum --err

# 清空日志
pm2 flush
```

### 查看数据库日志

```bash
# PostgreSQL 日志位置
# macOS (Homebrew)
tail -f /usr/local/var/log/postgresql@14.log

# Linux
tail -f /var/log/postgresql/postgresql-14-main.log

# Docker
docker logs postgres-container
```

### 查看 Nginx 日志

```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

---

## 🛠️ 调试工具

### 1. 检查系统资源

```bash
# CPU 和内存使用情况
top

# 磁盘使用情况
df -h

# 端口占用情况
lsof -i :3000
```

### 2. 数据库连接池

```typescript
// 查看连接池状态
const result = await prisma.$queryRaw`
  SELECT
    count(*) as total,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle
  FROM pg_stat_activity
  WHERE datname = 'school_forum'
`;

console.log('Database connections:', result);
```

### 3. Redis 监控

```bash
# 进入 Redis CLI
redis-cli

# 查看信息
INFO

# 查看所有键
KEYS *

# 监控命令执行
MONITOR

# 查看内存使用
INFO memory
```

---

## 📞 获取帮助

### 问题仍未解决？

1. **查看文档**
   - [开发指南](./DEVELOPMENT_GUIDE.md)
   - [API 文档](./02-implementation/api-documentation.md)
   - [部署指南](./03-deployment/aliyun-deployment.md)

2. **查看日志**
   - 应用日志: `pm2 logs` 或控制台
   - 数据库日志: PostgreSQL 日志文件
   - Nginx 日志: `/var/log/nginx/error.log`

3. **提交 Issue**
   - GitHub Issues: 详细描述问题和复现步骤
   - 附上相关日志和错误信息

4. **联系团队**
   - Email: support@example.com
   - 钉钉/企业微信: 技术支持群

---

## 📝 故障报告模板

提交故障报告时，请提供以下信息:

```markdown
**环境信息**
- Node.js 版本:
- pnpm 版本:
- PostgreSQL 版本:
- Redis 版本:
- 操作系统:

**问题描述**
简要描述遇到的问题

**复现步骤**
1. 步骤1
2. 步骤2
3. 步骤3

**期望行为**
描述期望的正确行为

**实际行为**
描述实际发生的错误行为

**错误日志**
```
粘贴相关的错误日志
```

**截图** (如适用)
附上相关截图

**尝试过的解决方案**
- 方案1: ...
- 方案2: ...
```

---

<div align="center">

**🔧 希望这份指南能帮助你快速解决问题！**

Made with ❤️ by 后端开发团队

</div>
