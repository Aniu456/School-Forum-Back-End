# 后台管理系统 API 文档

**仅限 ADMIN 角色访问** `/admin`

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

### 获取帖子列表
**GET** `/admin/posts?page=1&limit=20&isPinned=false&isHighlighted=false`

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

### 获取评论列表
**GET** `/admin/comments?page=1&limit=20`

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
**GET** `/admin/statistics`

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

### 获取全部公告（管理员视图）
**GET** `/announcements/admin/all?page=1&limit=20`

---

> 说明：举报管理、数据趋势、系统操作日志等模块目前尚未在后端实现，如后续补充再单独扩展对应文档小节。
