# 校园论坛 API 接入指南

> **版本**: v2.1
> **最后更新**: 2026-01-09
> **适用对象**: 前端开发人员

---

## 📑 文档目录

| 文档                               | 说明                          |
| ---------------------------------- | ----------------------------- |
| [README.md](./README.md)           | 本文档 - 快速开始 + 基础配置  |
| [API.md](./API.md)                 | 完整 API 接口文档 (120+ 接口) |
| [AUTH.md](./AUTH.md)               | 认证详解 (JWT、Token 管理)    |
| [ERROR_CODES.md](./ERROR_CODES.md) | 错误代码参考                  |

---

## 🚀 快速开始

### 基础信息

```bash
# 开发环境
Base URL: http://localhost:3000

# 生产环境
Base URL: https://api.your-domain.com
```

### 认证方式

除公开接口外，所有请求需在 Header 中携带 JWT Token：

```http
Authorization: Bearer <your_access_token>
```

---

## 📦 响应格式

### 列表响应

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number; // 当前页
    limit: number; // 每页条数
    total: number; // 总记录数
    totalPages: number; // 总页数
  };
}
```

### 错误响应

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}
```

### 图片资源

后端返回的图片 URL (如 `avatar`, `images`) 是相对路径，前端需拼接 Base URL：

```typescript
const fullUrl = `${BASE_URL}${user.avatar}`;
```

---

## 💡 核心数据类型

### User (用户)

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  role: 'USER' | 'ADMIN';
  followerCount: number;
  followingCount: number;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
}
```

### Post (帖子)

```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  images: string[];
  tags: string[]; // 如 ["二手交易", "校园活动"]
  authorId: string;
  author?: User;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  isHighlighted: boolean;
  createdAt: string;
}
```

### Comment (评论)

```typescript
interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author?: User;
  parentId?: string | null; // 一级评论为 null
  likeCount: number;
  createdAt: string;
  replies?: Comment[]; // 子评论
}
```

---

## 🔧 前端集成示例

### Axios 封装

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
});

// 请求拦截器：自动附加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 过期，跳转登录
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

### WebSocket 连接

```typescript
import { io } from 'socket.io-client';

const token = localStorage.getItem('accessToken');

// 1. 通知 Socket (默认命名空间)
const notificationSocket = io('http://localhost:3000', {
  auth: { token },
  reconnection: true,
});

notificationSocket.on('connect', () => {
  console.log('通知服务已连接');
});

// 监听新通知
notificationSocket.on('notification:new', (data) => {
  console.log('收到新通知:', data);
  // 更新右上角铃铛红点
});

// 监听未读数更新
notificationSocket.on('notification:unread_count_updated', (data) => {
  console.log('通知未读数更新:', data.unreadCount);
});

// 2. 聊天 Socket (专用命名空间 /chat)
const chatSocket = io('http://localhost:3000/chat', {
  auth: { token },
  reconnection: true,
});

chatSocket.on('connect', () => {
  console.log('聊天服务已连接');
});

// 监听新私信 (实时)
chatSocket.on('chat:message_created', (data) => {
  console.log('收到新私信:', data.message);
  // 如果当前在聊天窗口，直接追加消息
  // 如果不在聊天窗口，显示提示
});

// 监听私信未读数
chatSocket.on('chat:unread_count', (data) => {
  console.log('私信未读总数:', data.count);
});

// 监听对方正在输入
chatSocket.on('chat:user_typing', (data) => {
  console.log('对方正在输入:', data.userId);
});

export { notificationSocket, chatSocket };
```

---

## 📚 功能模块说明

### 帖子分类系统

v2.0+ 版本使用**标签系统**替代传统版块：

| 功能     | 标签        | 专用接口                               |
| -------- | ----------- | -------------------------------------- |
| 二手交易 | `#二手交易` | `GET /service-center/secondhand`       |
| 学习资源 | `#学习资源` | `GET /service-center/study-resource`   |
| 失物招领 | `#失物招领` | `GET /service-center/lost-and-found`   |
| 拼车拼单 | `#拼车拼单` | `GET /service-center/carpool`          |
| 社团招新 | `#社团招新` | `GET /service-center/club-recruitment` |

### 已禁用功能

- **草稿箱**: 使用前端 `localStorage` 实现
- **积分系统**: 使用点赞数/粉丝数替代

---

## ❓ 常见问题

**Q: Token 过期怎么办？**

A: 使用 `refreshToken` 调用 `/auth/refresh` 获取新 Token

**Q: 如何获取二手交易的商品价格？**

A: v2.0 版本已简化，价格信息在帖子内容中，前端可自行解析

**Q: 图片上传流程？**

A: 先调用 `/upload/image` 或 `/upload/images` 获取 URL，再在发帖时填入 `images` 字段

---

## 📞 技术支持

详细 API 文档请查看：[API.md](./API.md)
