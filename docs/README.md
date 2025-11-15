# 📚 校园论坛后台系统 - 完整文档

欢迎查阅校园论坛后台系统的完整技术文档。本文档分为三个主要部分：**设计**、**实现** 和 **部署**。

---

## 📖 文档导航

### 第一部分：设计 (Design)

系统架构、数据库设计、技术选型等设计层面的文档。

📁 **01-design/**

- [**架构设计文档**](./01-design/architecture-design.md)
  - 系统概述与技术栈
  - 整体架构设计
  - 模块化设计
  - 数据库设计 (PostgreSQL + Prisma Schema)
  - 安全设计
  - 性能优化策略
  - 可扩展性设计
  - 监控与日志
  - 部署架构
  - 开发规范

### 第二部分：实现 (Implementation)

API 接口文档、数据库操作指南等实现层面的文档。

📁 **02-implementation/**

- [**API 接口文档**](./02-implementation/api-documentation.md)
  - 接口概述
  - 认证模块 API
  - 用户模块 API
  - 帖子模块 API
  - 评论模块 API
  - 点赞模块 API
  - 搜索模块 API
  - 通知模块 API
  - 管理模块 API
  - 文件上传 API
  - 错误码说明
  - 请求示例

- [**数据库使用指南**](./02-implementation/database-guide.md)
  - Prisma 简介
  - 初始化设置
  - 数据库迁移
  - 常用命令
  - 数据填充 (Seed)
  - 最佳实践
  - 性能优化

### 第三部分：部署 (Deployment)

阿里云生产环境部署、运维管理等部署层面的文档。

📁 **03-deployment/**

- [**阿里云部署指南**](./03-deployment/aliyun-deployment.md)
  - 部署准备
  - 阿里云资源配置
    - VPC 网络
    - ECS 服务器
    - RDS PostgreSQL
    - Redis 缓存
    - OSS 对象存储
    - CDN 加速
  - 服务器环境搭建
  - 应用部署流程
  - Nginx 配置
  - SSL 证书配置
  - 监控与运维
  - 故障排查
  - 自动化部署

---

## 🚀 快速开始

### 对于开发者

1. **了解系统设计**
   - 先阅读 [架构设计文档](./01-design/architecture-design.md)，了解系统整体架构
   - 理解数据库设计和模块划分

2. **搭建开发环境**
   - 参考项目根目录 [README.md](../README.md) 的快速开始部分
   - 按照 [数据库使用指南](./02-implementation/database-guide.md) 初始化数据库

3. **开始开发**
   - 参考 [API 接口文档](./02-implementation/api-documentation.md) 了解接口规范
   - 使用 Prisma 进行数据库操作

### 对于运维人员

1. **准备阿里云资源**
   - 按照 [阿里云部署指南](./03-deployment/aliyun-deployment.md) 第 2 节创建资源

2. **搭建服务器环境**
   - 按照部署指南第 3 节配置服务器

3. **部署应用**
   - 按照部署指南第 4-6 节部署应用和配置 Nginx

4. **日常运维**
   - 参考部署指南第 7-8 节进行监控和故障排查

---

## 📊 文档结构

```
docs/
├── README.md                                  # 本文件 - 文档导航
│
├── 01-design/                                 # 设计文档
│   └── architecture-design.md                 # 架构设计
│
├── 02-implementation/                         # 实现文档
│   ├── api-documentation.md                   # API 接口文档
│   └── database-guide.md                      # 数据库使用指南
│
└── 03-deployment/                             # 部署文档
    └── aliyun-deployment.md                   # 阿里云部署指南
```

---

## 🔧 技术栈总览

| 类别 | 技术 | 版本 | 说明 |
|-----|------|------|------|
| **框架** | NestJS | v11 | 企业级 Node.js 框架 |
| **语言** | TypeScript | v5.7 | 类型安全的 JavaScript |
| **运行时** | Node.js | 18+ | JavaScript 运行环境 |
| **包管理** | pnpm | 8+ | 快速的包管理器 |
| **数据库** | PostgreSQL | 14+ | 关系型数据库 |
| **ORM** | Prisma | 最新 | 现代化 ORM 框架 |
| **缓存** | Redis | 6.0+ | 内存数据库 |
| **认证** | JWT + Passport | - | 身份认证 |
| **云平台** | 阿里云 | - | 云服务提供商 |
| **文件存储** | 阿里云 OSS | - | 对象存储 |

---

## 📝 文档版本

- **当前版本**: v1.0.0
- **最后更新**: 2025-11-15
- **维护者**: 后端开发团队

---

## 🤝 贡献指南

如果你发现文档有误或需要补充，欢迎：

1. 提交 Issue
2. 发起 Pull Request
3. 联系技术团队

---

## 📞 联系方式

- **技术支持**: support@example.com
- **问题反馈**: [GitHub Issues](https://github.com/your-org/school-forum-back-end/issues)
- **项目主页**: https://github.com/your-org/school-forum-back-end

---

## 📋 文档索引

### 按功能模块查找

- **用户认证**: [架构设计 - 认证模块](./01-design/architecture-design.md#311-认证模块) | [API 文档 - 认证](./02-implementation/api-documentation.md#2-认证模块)
- **用户管理**: [架构设计 - 用户模块](./01-design/architecture-design.md#312-用户模块) | [API 文档 - 用户](./02-implementation/api-documentation.md#3-用户模块)
- **帖子管理**: [架构设计 - 帖子模块](./01-design/architecture-design.md#313-帖子模块) | [API 文档 - 帖子](./02-implementation/api-documentation.md#4-帖子模块)
- **评论系统**: [架构设计 - 评论模块](./01-design/architecture-design.md#314-评论模块) | [API 文档 - 评论](./02-implementation/api-documentation.md#5-评论模块)
- **点赞功能**: [架构设计 - 点赞模块](./01-design/architecture-design.md#315-点赞模块) | [API 文档 - 点赞](./02-implementation/api-documentation.md#6-点赞模块)
- **搜索功能**: [架构设计 - 搜索模块](./01-design/architecture-design.md#316-搜索模块) | [API 文档 - 搜索](./02-implementation/api-documentation.md#7-搜索模块)
- **通知系统**: [架构设计 - 通知模块](./01-design/architecture-design.md#317-通知模块) | [API 文档 - 通知](./02-implementation/api-documentation.md#8-通知模块)
- **内容审核**: [架构设计 - 管理模块](./01-design/architecture-design.md#318-管理模块) | [API 文档 - 管理](./02-implementation/api-documentation.md#9-管理模块)

### 按开发阶段查找

**项目初始化**
1. [架构设计文档](./01-design/architecture-design.md) - 了解系统设计
2. [数据库使用指南](./02-implementation/database-guide.md) - 初始化数据库

**功能开发**
1. [API 接口文档](./02-implementation/api-documentation.md) - 查看接口规范
2. [架构设计 - 模块设计](./01-design/architecture-design.md#3-模块设计) - 了解模块结构

**生产部署**
1. [阿里云部署指南](./03-deployment/aliyun-deployment.md) - 完整部署流程

---

## ✅ 文档检查清单

在开始开发前，请确保你已经：

- [ ] 阅读架构设计文档，了解系统整体架构
- [ ] 理解数据库设计和 Prisma Schema
- [ ] 熟悉 API 接口规范
- [ ] 配置本地开发环境
- [ ] 初始化数据库并填充测试数据
- [ ] 了解开发规范和 Git 提交规范

在部署到生产环境前，请确保：

- [ ] 已创建阿里云相关资源（ECS、RDS、Redis、OSS）
- [ ] 配置了 VPC 网络和安全组
- [ ] 设置了生产环境的环境变量
- [ ] 运行了数据库迁移
- [ ] 配置了 Nginx 反向代理
- [ ] 配置了 SSL 证书
- [ ] 设置了日志和监控
- [ ] 配置了数据库备份

---

<div align="center">

**📖 开始阅读**: 建议从 [架构设计文档](./01-design/architecture-design.md) 开始

**🚀 快速上手**: 查看项目根目录 [README.md](../README.md)

Made with ❤️ by 后端开发团队

</div>
