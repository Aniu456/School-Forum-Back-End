# 后台管理系统 API 文档

## 基础说明

- **基础 URL（开发环境）**：`http://localhost:30000`
- **管理接口前缀**：主要为 `/admin`；公告模块使用 `/announcements` 前缀，但同样只允许管理员访问写操作。
- **认证方式**：所有后台接口都需要管理员 JWT，在请求头中携带：

  `Authorization: Bearer <accessToken>`

- **角色要求**：仅 `role = ADMIN` 的用户可以访问本页所有接口。
- **响应/错误结构**：与《普通用户端 API 文档》一致，外层均包含：

  ```json
  {
    "success": true,
    "data": { ... },
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
  ```

  错误时 `success = false`，并返回 `statusCode`、`message` 等字段。

> 下文为简化示例，仅描述 `data` 部分结构。

## 用户管理 `/admin/users`

### 获取用户列表
**GET** `/admin/users?page=1&limit=20&role=USER&isBanned=false`

```typescript
// 响应
{
  data: [
    {
      id: string;
      username: string;
      email: string;
      nickname: string;
      avatar: string;
      role: "USER" | "ADMIN";
      isActive: boolean;
      isBanned: boolean;
      followerCount: number;
      followingCount: number;
      createdAt: Date;
      postCount: number;       // 帖子数量
      commentCount: number;    // 评论数量
    }
  ],
  meta: { page, limit, total, totalPages }
}
```

### 封禁用户
**POST** `/admin/users/:id/ban`

```typescript
// 请求体
{
  reason?: string;        // 封禁原因
}

// 响应
{
  message: "用户已封禁";
  user: User;
}
```

### 解封用户
**POST** `/admin/users/:id/unban`

### 删除用户（物理删除）
**DELETE** `/admin/users/:id`

> 谨慎操作，删除后不可恢复。

### 重置用户密码
**POST** `/admin/users/:id/reset-password`

```typescript
// 请求体
{
  newPassword: string;    // 新密码
}
```

### 修改用户角色
**PATCH** `/admin/users/:id/role`

```typescript
// 请求体
{
  role: "USER" | "ADMIN";
}
```

### 查看用户登录历史
**GET** `/admin/users/:id/login-history?page=1&limit=20`

### 禁止/允许发帖
**POST** `/admin/users/:id/toggle-post-permission`

### 禁止/允许评论
**POST** `/admin/users/:id/toggle-comment-permission`

---

## 帖子管理 `/admin/posts`

### 获取帖子详情
**GET** `/admin/posts/:id`

### 获取帖子列表
**GET** `/admin/posts?page=1&limit=20&isPinned=false&isHighlighted=false&keyword=xxx&authorId=uid&tag=标签`

- `keyword`：标题/内容模糊搜索
- `authorId`：按作者筛选
- `tag`：按标签筛选

```typescript
// 响应（简化）
{
  data: Array<{
    id: string;
    title: string;
    author: { id: string; username: string; nickname: string; avatar: string };
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isPinned: boolean;
    isHighlighted: boolean;
    isLocked: boolean;
    isHidden: boolean;
    createdAt: Date;
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number };
}
```

### 置顶 / 取消置顶
**POST** `/admin/posts/:id/pin`  /  **DELETE** `/admin/posts/:id/pin`

### 加精 / 取消加精
**POST** `/admin/posts/:id/highlight`  /  **DELETE** `/admin/posts/:id/highlight`

### 锁定 / 解锁评论
**POST** `/admin/posts/:id/lock`  /  **DELETE** `/admin/posts/:id/lock`

### 隐藏 / 取消隐藏
**POST** `/admin/posts/:id/hide`  /  **POST** `/admin/posts/:id/unhide`

### 批量删除帖子
**POST** `/admin/posts/bulk-delete`

**物理删除**，删除后数据将不可恢复。

```typescript
// 请求体
{
  ids: string[];          // 要删除的帖子 ID 列表
}
```

---

## 评论管理 `/admin/comments`

### 获取评论详情
**GET** `/admin/comments/:id`

### 获取评论列表
**GET** `/admin/comments?page=1&limit=20&keyword=xxx&authorId=uid&postId=pid`

- `keyword`：内容包含
- `authorId`：按作者筛选
- `postId`：按帖子筛选

### 删除单条评论
**DELETE** `/admin/comments/:id`

### 批量删除评论
**POST** `/admin/comments/bulk-delete`

**物理删除**，删除后数据将不可恢复。

```typescript
// 请求体
{
  ids: string[];          // 要删除的评论 ID 列表
}
```

---

## 系统统计 `/admin/statistics`

后台提供了一个简单的统计接口用于仪表盘概览：

### 获取系统统计
**GET** `/admin/statistics`（别名：`/admin/statistics/overview`）

```typescript
// 响应
{
  users: {
    total: number;        // 用户总数
    active: number;       // 激活用户数
    banned: number;       // 被封禁用户数
  };
  posts: {
    total: number;        // 帖子总数
  };
  comments: {
    total: number;        // 评论总数
  };
}
```

---

## 公告管理 `/announcements`

公告模块不在 `/admin` 前缀下，但受 `Role.ADMIN` 保护，仅管理员可创建、修改、删除。

### 创建公告
**POST** `/announcements`

### 获取公告列表（公开）
**GET** `/announcements?page=1&limit=20`

### 获取公告详情（公开）
**GET** `/announcements/:id`

### 更新公告
**PUT** `/announcements/:id`

### 删除公告
**DELETE** `/announcements/:id`

**物理删除**，删除后数据不可恢复。

### 隐藏/显示公告
**PATCH** `/announcements/:id/toggle-hidden`

```typescript
// 请求体
{
  isHidden: boolean;      // true: 隐藏公告；false: 取消隐藏
}
```

### 获取全部公告（管理员视图）
**GET** `/announcements/admin/all?page=1&limit=20`

### 批量删除公告
**POST** `/announcements/admin/bulk-delete`

```typescript
// 请求体
{
  ids: string[];          // 要删除的公告 ID 列表
}
```

---

> 说明：举报管理、数据趋势、系统操作日志等模块目前尚未在后端实现，如后续补充再单独扩展对应文档小节。
