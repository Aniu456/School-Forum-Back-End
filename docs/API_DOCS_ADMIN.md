# 管理员端 API 文档

## 基础说明

- **基础 URL（开发环境）**：`http://localhost:30000`
- **认证方式**：所有管理操作都需要管理员 JWT，在请求头中携带：

  `Authorization: Bearer <accessToken>`

- **权限要求**：调用方必须是 `role = ADMIN` 的用户；普通用户只能调用《普通用户端 API 文档》中的接口。
- **响应/错误结构**：与《普通用户端 API 文档》一致，外层都有 `success` 包装，这里只描述 `data` 部分结构。

管理员在前台（管理入口）拥有所有普通用户权限，另外可以通过后台接口对帖子、评论和公告进行管理。这里重点说明**在前台界面可见的管理能力**，真实调用的 HTTP 接口以《后台管理系统 API 文档》为准。

## 帖子管理（前台管理入口）

前台管理入口会调用后台接口 `/admin/posts` 和 `/admin/posts/:id/*` 完成以下操作：

- 置顶 / 取消置顶帖子
- 标记精华 / 取消精华
- 锁定 / 解锁帖子（禁止/允许继续评论）
- 隐藏 / 取消隐藏帖子
- 批量删除帖子（**物理删除，数据不可恢复**）

### 可用能力一览

- **置顶帖子**：对应后台 `POST /admin/posts/:id/pin` / `DELETE /admin/posts/:id/pin`
- **精华管理**：对应 `POST /admin/posts/:id/highlight` / `DELETE /admin/posts/:id/highlight`
- **锁定评论**：对应 `POST /admin/posts/:id/lock` / `DELETE /admin/posts/:id/lock`
- **隐藏帖子**：对应 `POST /admin/posts/:id/hide` / `POST /admin/posts/:id/unhide`
- **批量删除帖子**：对应 `POST /admin/posts/bulk-delete`

> 说明：前台不会直接调用 `/posts/:id` 这类通用接口，而是统一走 `/admin/posts/...`，以便做权限控制和审计。

---

## 评论管理（前台管理入口）

管理员可以在评论管理页面，对评论进行批量删除或针对单条进行删除，这些操作对应后台接口：

- **获取评论列表**：`GET /admin/comments?page=1&limit=20&keyword=内容关键字&authorId=xxx&postId=xxx`
- **批量删除评论**：`POST /admin/comments/bulk-delete`

前台“删除任意评论”的按钮，底层统一调用 `/admin/comments/bulk-delete`，即使只传一个 ID。

---

## 公告管理（前台管理入口）

公告模块由 `AnnouncementsController` 提供，路由前缀为 `/announcements`：

### 发布公告
**POST** `/announcements`

需要管理员登录。

```typescript
// 请求体
{
  title: string;          // 标题
  content: string;        // 内容
  type?: "INFO" | "WARNING" | "URGENT"; // 类型，默认 INFO
  targetRole?: "USER" | "ADMIN"; // 目标角色，不传表示所有人都可见
  isPinned?: boolean;     // 是否置顶，默认 false
  isPublished?: boolean;  // 是否立即发布，默认 false
}

// data 部分（省略外层 success 包装）
{
  id: string;
  title: string;
  content: string;
  type: "INFO" | "WARNING" | "URGENT";
  targetRole: "USER" | "ADMIN" | null;
  isPublished: boolean;
  isPinned: boolean;
  author: { id: string; username: string; nickname: string };
  createdAt: Date;
  updatedAt: Date;
}
```

### 更新公告
**PUT** `/announcements/:id`

```typescript
// 请求体（部分字段可选）
{
  title?: string;
  content?: string;
  type?: "INFO" | "WARNING" | "URGENT";
  targetRole?: "USER" | "ADMIN"; // 不传表示仍为所有人
  isPinned?: boolean;
  isPublished?: boolean;
}
```

### 删除公告
**DELETE** `/announcements/:id`

**物理删除**，删除后数据不可恢复。

### 批量删除公告
**POST** `/announcements/admin/bulk-delete`

```typescript
// 请求体
{
  ids: string[]; // 要删除的公告 ID 列表
}
```

### 获取公告列表（公开）
**GET** `/announcements?page=1&limit=20`

### 管理员查看全部公告
**GET** `/announcements/admin/all?page=1&limit=20`

> 日常前台“公告管理”列表和详情页，分别调用 `/announcements/admin/all`、`/announcements/:id`。

> 如需“隐藏/显示公告”能力，可在管理端调用后台接口：
> `PATCH /announcements/:id/toggle-hidden`，请求体 `{ isHidden: boolean }`。

---

> 说明：原文档中的 `/points/adjust`（手动调整积分）接口当前并未在后端实现，如后续补充积分运营后台，再单独扩展文档。
