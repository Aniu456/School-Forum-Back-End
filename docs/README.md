# 📚 校园论坛后台系统 - 完整文档

欢迎查阅校园论坛后台系统的完整技术文档。本文档体系包含：**架构设计**、**API 文档**、**数据库指南**、**前端交接文档** 和 **部署指南**。

---

## 📋 快速导航

### ⭐ 前端开发者必读

| 优先级 | 文档 | 说明 | 受众 |
|-------|-----|------|------|
| ⭐⭐⭐⭐⭐ | [**FRONTEND_USER_HANDOVER.md**](./FRONTEND_USER_HANDOVER.md) | 用户端前端完整交接文档 | 用户端前端工程师 |
| ⭐⭐⭐⭐⭐ | [**FRONTEND_ADMIN_HANDOVER.md**](./FRONTEND_ADMIN_HANDOVER.md) | 管理端前端完整交接文档 | 管理端前端工程师 |
| ⭐⭐⭐⭐ | [**API 接口文档**](./02-implementation/api-documentation.md) | 完整的 API 接口说明 | 所有前端开发者 |

### 🛠️ 后端开发者文档

- [**DEVELOPMENT_GUIDE.md**](./DEVELOPMENT_GUIDE.md) - 完整的开发指南
  - 开发环境搭建
  - 项目结构详解
  - 代码规范和最佳实践
  - 调试技巧和性能优化
  - 安全最佳实践

- [**TROUBLESHOOTING.md**](./TROUBLESHOOTING.md) - 故障排查指南
  - 环境相关问题
  - 数据库问题
  - 认证授权问题
  - CORS 跨域问题
  - 性能和部署问题
  - 日志分析

---

## 📖 文档体系

### 📁 架构与设计

- [**架构设计文档**](./01-design/architecture-design.md)
  - 系统概述与技术栈
  - 整体架构设计（双前端单后端）
  - 模块化设计（8个核心模块）
  - 数据库设计 (PostgreSQL + Prisma)
  - 安全设计与性能优化
  - 可扩展性与监控日志

### 📁 API 与数据库

- [**API 接口文档**](./02-implementation/api-documentation.md)
  - 认证、用户、帖子、评论、点赞、搜索、通知、管理模块 API
  - 草稿、收藏、关注、推荐、话题模块 API
  - WebSocket 实时通知
  - 完整的请求/响应示例

- [**数据库使用指南**](./02-implementation/database-guide.md)
  - Prisma ORM 使用
  - 数据库迁移与数据填充
  - 常用命令与最佳实践

### 📁 前端交接文档

- [**用户端前端交接文档**](./FRONTEND_USER_HANDOVER.md) ⭐ **新增**
  - 包含注册、登录、帖子、评论、点赞、收藏、关注等所有功能
  - 完整的 TypeScript + React/Vue 代码示例
  - WebSocket 实时通知集成
  - 图片上传与错误处理

- [**管理端前端交接文档**](./FRONTEND_ADMIN_HANDOVER.md) ⭐ **新增**
  - 管理员认证与权限控制
  - 用户管理、内容管理、举报管理
  - 数据统计与可视化（ECharts）
  - 完整的 Ant Design 后台示例

### 📁 部署与运维

- [**阿里云部署指南**](./03-deployment/aliyun-deployment.md)
  - 阿里云资源配置（VPC/ECS/RDS/Redis/OSS/CDN）
  - 服务器环境搭建与应用部署
  - Nginx 配置与 SSL 证书
  - 监控、日志与故障排查

---

## 🚀 快速开始

### 前端开发者

1. **用户端开发**：阅读 [FRONTEND_USER_HANDOVER.md](./FRONTEND_USER_HANDOVER.md)
2. **管理端开发**：阅读 [FRONTEND_ADMIN_HANDOVER.md](./FRONTEND_ADMIN_HANDOVER.md)
3. **API 参考**：查看 [API 接口文档](./02-implementation/api-documentation.md)

### 后端开发者

1. **环境搭建**：查看项目根目录 [README.md](../README.md)
2. **开发规范**：阅读 [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
3. **架构理解**：阅读 [架构设计文档](./01-design/architecture-design.md)
4. **问题排查**：查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 运维人员

1. **部署应用**：按照 [阿里云部署指南](./03-deployment/aliyun-deployment.md)
2. **故障处理**：参考 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📊 文档结构

```
docs/
├── README.md                                  # 文档总索引
├── FRONTEND_USER_HANDOVER.md                  # 用户端前端交接文档 ⭐
├── FRONTEND_ADMIN_HANDOVER.md                 # 管理端前端交接文档 ⭐
├── DEVELOPMENT_GUIDE.md                       # 开发指南
├── TROUBLESHOOTING.md                         # 故障排查指南
│
├── 01-design/
│   └── architecture-design.md                 # 系统架构设计
│
├── 02-implementation/
│   ├── api-documentation.md                   # 完整 API 文档
│   └── database-guide.md                      # 数据库使用指南
│
└── 03-deployment/
    └── aliyun-deployment.md                   # 阿里云部署指南
```

---

## 🔧 技术栈

| 类别 | 技术 | 版本 |
|-----|------|------|
| **框架** | NestJS | v11 |
| **语言** | TypeScript | v5.7 |
| **数据库** | PostgreSQL | 14+ |
| **ORM** | Prisma | 最新 |
| **缓存** | Redis | 6.0+ |
| **认证** | JWT + Passport | - |
| **云平台** | 阿里云 | ECS/RDS/Redis/OSS |

---

## 📞 联系方式

- **技术支持**: support@example.com
- **问题反馈**: GitHub Issues
- **文档维护**: 后端开发团队
- **最后更新**: 2025-11-15

---

<div align="center">

**📖 开始阅读**: 建议从 [架构设计文档](./01-design/architecture-design.md) 开始

**🚀 快速上手**: 查看项目根目录 [README.md](../README.md)

Made with ❤️ by 后端开发团队

</div>
