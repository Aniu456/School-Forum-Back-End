# 🎓 校园论坛后台系统

<div align="center">

基于 **NestJS + TypeScript + PostgreSQL + Prisma** 的现代化校园社交论坛后端服务

[![NestJS](https://img.shields.io/badge/NestJS-v11-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)

</div>

---

## 📖 项目简介

校园论坛后台系统是一个为校园用户打造的社交互动平台，提供发帖、评论、点赞、搜索等核心功能。系统采用 **NestJS** 框架开发，使用 **PostgreSQL** 数据库，部署在**阿里云**平台，具有高性能、高可用、易扩展的特点。

### ✨ 核心功能

- 🔐 **用户认证** - JWT 身份认证、用户注册登录
- 📝 **帖子管理** - 发布、编辑、删除帖子，支持图片上传、草稿保存
- 💬 **评论系统** - 一级评论和二级回复
- ❤️ **点赞功能** - 对帖子和评论进行点赞
- 🔍 **全文搜索** - 关键词搜索、标签筛选
- 👤 **个人中心** - 用户资料、发帖历史
- 🛡️ **内容审核** - 举报机制、管理员后台
- 🔔 **通知系统** - 实时消息推送、WebSocket 支持
- 📌 **帖子收藏** - 创建收藏夹、收藏帖子
- 👥 **用户关注** - 关注用户、查看关注列表
- 🌟 **热门推荐** - 热门帖子、趋势帖子、个性化推荐、热门话题

### 🛠️ 技术栈

**核心框架**
- NestJS v11 - 企业级 Node.js 框架
- TypeScript v5.7 - 类型安全的 JavaScript
- Node.js 18+ - JavaScript 运行时

**数据层**
- PostgreSQL 14+ - 关系型数据库
- Prisma - 现代化 ORM 框架
- Redis 6.0+ - 缓存与会话存储

**云服务 (阿里云)**
- ECS - 应用服务器
- RDS PostgreSQL - 托管数据库
- Redis - 托管缓存服务
- OSS - 对象存储 (图片/文件)

**认证与安全**
- JWT - 身份认证
- Passport - 认证中间件
- bcrypt - 密码加密

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14
- Redis >= 6.0

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd school-forum-back-end

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 4. 初始化数据库
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed  # 可选：填充测试数据

# 5. 启动开发服务器
pnpm run start:dev
```

应用将在 `http://localhost:3000` 启动

### 验证安装

```bash
curl http://localhost:3000/api/v1/health
```

---

## 📁 项目结构

```
school-forum-back-end/
├── docs/                          # 📚 文档目录
│   ├── README.md                  # 项目说明文档
│   ├── architecture-design.md     # 架构设计文档
│   ├── api-documentation.md       # API 接口文档
│   └── database-guide.md          # 数据库使用指南
├── prisma/                        # 🗄️ Prisma 配置
│   ├── schema.prisma              # 数据模型定义
│   ├── seed.ts                    # 数据填充脚本
│   └── migrations/                # 数据库迁移文件
├── src/                           # 💻 源代码
│   ├── auth/                      # 认证模块
│   ├── users/                     # 用户模块
│   ├── posts/                     # 帖子模块
│   ├── comments/                  # 评论模块
│   ├── likes/                     # 点赞模块
│   ├── search/                    # 搜索模块
│   ├── notifications/             # 通知模块
│   ├── admin/                     # 管理模块
│   ├── common/                    # 公共模块
│   │   ├── decorators/            # 装饰器
│   │   ├── filters/               # 异常过滤器
│   │   ├── guards/                # 守卫
│   │   ├── interceptors/          # 拦截器
│   │   └── pipes/                 # 管道
│   ├── app.module.ts              # 根模块
│   └── main.ts                    # 应用入口
├── test/                          # 🧪 测试
├── .env.example                   # 环境变量示例
├── .gitignore                     # Git 忽略配置
├── nest-cli.json                  # NestJS CLI 配置
├── package.json                   # 项目配置
├── pnpm-lock.yaml                 # 依赖锁定
├── tsconfig.json                  # TypeScript 配置
└── README.md                      # 本文件
```

---

## 📝 开发指南

### 常用命令

```bash
# 开发
pnpm run start          # 启动应用
pnpm run start:dev      # 启动开发模式 (热重载)
pnpm run start:debug    # 启动调试模式

# 构建
pnpm run build          # 编译 TypeScript

# 测试
pnpm run test           # 运行单元测试
pnpm run test:cov       # 测试覆盖率
pnpm run test:e2e       # E2E 测试

# 代码质量
pnpm run lint           # 代码检查
pnpm run lint:fix       # 自动修复
pnpm run format         # 格式化代码

# 数据库
pnpm prisma studio      # 打开数据库管理界面
pnpm prisma generate    # 生成 Prisma Client
pnpm prisma migrate dev # 创建迁移
```

### 创建新模块

```bash
# 使用 NestJS CLI 创建模块
nest g resource <module-name>

# 示例：创建消息模块
nest g resource messages
```

### 代码规范

- 使用 ESLint + Prettier 保证代码质量
- 遵循 NestJS 官方风格指南
- TypeScript 严格模式
- 所有 API 接口必须添加 DTO 验证
- 编写单元测试覆盖核心业务逻辑

---

## 📚 文档

| 文档 | 说明 |
|-----|------|
| [详细说明](./docs/README.md) | 完整的项目说明和部署指南 |
| [架构设计](./docs/architecture-design.md) | 系统架构、模块设计、数据库设计 |
| [API 文档](./docs/api-documentation.md) | RESTful API 接口详细文档 |
| [数据库指南](./docs/database-guide.md) | Prisma 使用和数据库迁移指南 |

---

## 🧪 测试

```bash
# 运行所有测试
pnpm run test

# 查看测试覆盖率
pnpm run test:cov

# E2E 测试
pnpm run test:e2e
```

---

## 🚢 部署

### 开发环境

```bash
pnpm run start:dev
```

### 生产环境 (阿里云)

详细部署步骤请参考：[部署文档](./docs/README.md#-部署)

简要步骤：
1. 准备阿里云资源 (ECS、RDS、Redis、OSS)
2. 配置服务器环境
3. 部署应用代码
4. 配置 Nginx 反向代理
5. 设置 SSL 证书
6. 启动应用 (PM2)

---

## 🔒 安全

- ✅ JWT 认证
- ✅ 密码加密 (bcrypt)
- ✅ SQL 注入防护 (Prisma ORM)
- ✅ XSS 防护
- ✅ CORS 配置
- ✅ Rate Limiting (限流)
- ✅ 输入验证 (class-validator)

---

## 🗺️ 路线图

### v0.1.0 - 基础架构 ✅
- [x] 项目初始化
- [x] 文档编写
- [x] 数据库设计

### v0.2.0 - 核心功能 ✅
- [x] 认证模块
- [x] 用户模块
- [x] 帖子模块
- [x] 评论模块
- [x] 点赞模块

### v0.3.0 - 高级功能 ✅
- [x] 搜索功能
- [x] 通知系统
- [x] 管理后台

### v0.4.0 - 扩展功能 ✅
- [x] WebSocket 实时通知推送
- [x] 帖子草稿功能
- [x] 帖子收藏功能
- [x] 用户关注系统
- [x] 热门话题推荐算法
- [x] Session 和 CORS 配置
- [x] URL 版本控制 (/api/v1)

### v1.0.0 - 正式发布
- [ ] 性能优化
- [ ] 完整测试覆盖
- [ ] 生产环境部署
- [ ] 文档完善

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### Commit 规范

遵循 Conventional Commits：

```
feat: 添加新功能
fix: 修复 Bug
docs: 文档更新
refactor: 代码重构
test: 测试相关
chore: 构建/工具链更新
```

---

## 📄 许可证

本项目采用 [MIT License](LICENSE)

---

## 👥 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/your-org/school-forum-back-end/issues)
- **技术支持**: support@example.com
- **项目主页**: https://github.com/your-org/school-forum-back-end

---

## 🙏 致谢

- [NestJS](https://nestjs.com/) - 优秀的 Node.js 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- [Prisma](https://www.prisma.io/) - 现代化的 ORM
- [PostgreSQL](https://www.postgresql.org/) - 强大的开源数据库
- [阿里云](https://www.aliyun.com/) - 可靠的云服务平台

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star ⭐**

Made with ❤️ by 后端开发团队

</div>
