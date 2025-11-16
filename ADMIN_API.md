# 校园论坛管理端 API 接口文档

> **Base URL**: `http://localhost:3000`
> **认证方式**: JWT Bearer Token
> **权限要求**: 所有接口都需要 ADMIN 角色

---

## 认证说明

所有管理端接口请求都需要在 Header 中携带 JWT Token:

```
Authorization: Bearer <your_access_token>
```

登录后获取的 `accessToken` 需要保存在客户端,每次请求都要带上。

---

## 1. 认证接口

### 1.1 管理员注册

```
POST /auth/register-admin
```

**请求体**:
```json
{
  "username": "admin01",
  "email": "admin@example.com",
  "password": "your_password",
  "nickname": "管理员",
  "adminKey": "your-super-secret-admin-key"
}
```

**重要说明**:
- `adminKey` 是管理员注册密钥,必须和后端 `.env` 文件中的 `ADMIN_REGISTRATION_KEY` 一致
- 这个密钥用于保护管理员注册接口,防止任何人都能注册管理员账号
- 注册成功后会自动获得 `ADMIN` 角色

**响应示例**:
```json
{
  "user": {
    "id": "admin-uuid",
    "username": "admin01",
    "email": "admin@example.com",
    "nickname": "管理员",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2025-11-16T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 管理员登录

```
POST /auth/login
```

**请求体**:
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**响应示例**:
```json
{
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "管理员",
    "role": "ADMIN",
    "avatar": null,
    "isActive": true,
    "isBanned": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**注意**: 必须确保 `user.role` 为 `ADMIN`,否则无法访问管理端接口。

### 1.3 刷新 Token

```
POST /auth/refresh
```

**请求体**:
```json
{
  "refreshToken": "your_refresh_token"
}
```

**响应示例**:
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

---

## 2. 用户管理

### 2.1 获取用户列表

```
GET /admin/users?page=1&limit=20&role=STUDENT&isBanned=false
```

**Query 参数**:
- `page` (可选): 页码,默认 1
- `limit` (可选): 每页数量,默认 20
- `role` (可选): 角色筛选 (`STUDENT` / `TEACHER` / `ADMIN`)
- `isBanned` (可选): 是否封禁 (`true` / `false`)

**响应示例**:
```json
{
  "data": [
    {
      "id": "user-uuid",
      "username": "student01",
      "email": "student01@example.com",
      "nickname": "学生001",
      "role": "STUDENT",
      "studentId": "2024001",
      "avatar": "https://example.com/avatar.jpg",
      "bio": "个人简介",
      "isBanned": false,
      "isActive": true,
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 2.2 封禁用户

```
POST /admin/users/:id/ban
```

**路径参数**:
- `id`: 用户 ID

**响应示例**:
```json
{
  "message": "用户已被封禁"
}
```

### 2.3 解封用户

```
POST /admin/users/:id/unban
```

**路径参数**:
- `id`: 用户 ID

**响应示例**:
```json
{
  "message": "用户已被解封"
}
```

### 2.4 重置用户密码

```
POST /admin/users/:id/reset-password
```

**请求体**:
```json
{
  "newPassword": "new_password_123"
}
```

**响应示例**:
```json
{
  "message": "密码重置成功"
}
```

### 2.5 修改用户角色

```
PATCH /admin/users/:id/role
```

**请求体**:
```json
{
  "role": "TEACHER"
}
```

**可选值**: `STUDENT` / `TEACHER` / `ADMIN`

**响应示例**:
```json
{
  "message": "用户角色已更新"
}
```

### 2.6 查看用户登录历史

```
GET /admin/users/:id/login-history?page=1&limit=20
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "history-uuid",
      "userId": "user-uuid",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### 2.7 禁止/允许用户发帖

```
POST /admin/users/:id/toggle-post-permission
```

**请求体**:
```json
{
  "canPost": false
}
```

**响应示例**:
```json
{
  "message": "用户发帖权限已更新"
}
```

### 2.8 禁止/允许用户评论

```
POST /admin/users/:id/toggle-comment-permission
```

**请求体**:
```json
{
  "canComment": false
}
```

**响应示例**:
```json
{
  "message": "用户评论权限已更新"
}
```

---

## 3. 举报管理

### 3.1 获取举报列表

```
GET /admin/reports?page=1&limit=20&status=PENDING&targetType=POST
```

**Query 参数**:
- `page` (可选): 页码
- `limit` (可选): 每页数量
- `status` (可选): 状态 (`PENDING` / `APPROVED` / `REJECTED`)
- `targetType` (可选): 举报对象类型 (`POST` / `COMMENT` / `USER`)

**响应示例**:
```json
{
  "data": [
    {
      "id": "report-uuid",
      "targetType": "POST",
      "targetId": "post-uuid",
      "reason": "包含不当内容",
      "description": "详细描述...",
      "status": "PENDING",
      "reporter": {
        "id": "user-uuid",
        "username": "reporter01",
        "nickname": "举报人"
      },
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 30,
    "page": 1,
    "limit": 20
  }
}
```

### 3.2 处理举报

```
PATCH /admin/reports/:id
```

**请求体**:
```json
{
  "status": "APPROVED",
  "handleNote": "确认违规,已删除内容"
}
```

**status 可选值**: `APPROVED` (通过) / `REJECTED` (拒绝)

**响应示例**:
```json
{
  "message": "举报已处理"
}
```

---

## 4. 内容管理

### 4.1 置顶帖子

```
POST /admin/posts/:id/pin
```

**响应示例**:
```json
{
  "message": "帖子已置顶"
}
```

### 4.2 取消置顶

```
DELETE /admin/posts/:id/pin
```

**响应示例**:
```json
{
  "message": "已取消置顶"
}
```

### 4.3 加精华

```
POST /admin/posts/:id/highlight
```

**响应示例**:
```json
{
  "message": "帖子已加精"
}
```

### 4.4 取消精华

```
DELETE /admin/posts/:id/highlight
```

**响应示例**:
```json
{
  "message": "已取消精华"
}
```

### 4.5 锁定帖子 (禁止评论)

```
POST /admin/posts/:id/lock
```

**响应示例**:
```json
{
  "message": "帖子已锁定"
}
```

### 4.6 解锁帖子

```
DELETE /admin/posts/:id/lock
```

**响应示例**:
```json
{
  "message": "帖子已解锁"
}
```

### 4.7 隐藏帖子

```
POST /admin/posts/:id/hide
```

**响应示例**:
```json
{
  "message": "帖子已隐藏"
}
```

### 4.8 取消隐藏

```
POST /admin/posts/:id/unhide
```

**响应示例**:
```json
{
  "message": "帖子已恢复显示"
}
```

### 4.9 批量删除帖子

```
POST /admin/posts/bulk-delete
```

**请求体**:
```json
{
  "ids": ["post-uuid-1", "post-uuid-2", "post-uuid-3"]
}
```

**响应示例**:
```json
{
  "message": "成功删除 3 个帖子"
}
```

### 4.10 批量删除评论

```
POST /admin/comments/bulk-delete
```

**请求体**:
```json
{
  "ids": ["comment-uuid-1", "comment-uuid-2"]
}
```

**响应示例**:
```json
{
  "message": "成功删除 2 条评论"
}
```

---

## 5. 公告管理

### 5.1 创建公告

```
POST /announcements
```

**请求体**:
```json
{
  "title": "系统维护通知",
  "content": "本周五晚上 10 点进行系统维护...",
  "priority": "HIGH"
}
```

**priority 可选值**: `LOW` / `MEDIUM` / `HIGH`

**响应示例**:
```json
{
  "id": "announcement-uuid",
  "title": "系统维护通知",
  "content": "本周五晚上 10 点进行系统维护...",
  "priority": "HIGH",
  "author": {
    "id": "admin-uuid",
    "username": "admin",
    "nickname": "管理员"
  },
  "createdAt": "2025-11-15T10:00:00.000Z"
}
```

### 5.2 获取所有公告 (管理端)

```
GET /announcements/admin/all?page=1&limit=20
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "announcement-uuid",
      "title": "系统维护通知",
      "content": "...",
      "priority": "HIGH",
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

### 5.3 更新公告

```
PUT /announcements/:id
```

**请求体**:
```json
{
  "title": "更新的标题",
  "content": "更新的内容",
  "priority": "MEDIUM"
}
```

**响应示例**:
```json
{
  "message": "公告已更新"
}
```

### 5.4 删除公告

```
DELETE /announcements/:id
```

**响应示例**:
```json
{
  "message": "公告已删除"
}
```

---

## 6. 统计数据

### 6.1 获取系统统计

```
GET /admin/statistics
```

**响应示例**:
```json
{
  "users": {
    "total": 1000,
    "active": 800,
    "banned": 20,
    "newToday": 15,
    "newThisWeek": 50,
    "newThisMonth": 200
  },
  "posts": {
    "total": 5000,
    "published": 4800,
    "deleted": 200,
    "newToday": 50,
    "newThisWeek": 300
  },
  "comments": {
    "total": 15000,
    "newToday": 200
  },
  "reports": {
    "pending": 10,
    "approved": 50,
    "rejected": 20
  }
}
```

---

## 错误响应格式

所有接口在出错时都会返回以下格式:

```json
{
  "statusCode": 403,
  "message": "权限不足",
  "error": "Forbidden",
  "timestamp": "2025-11-15T10:00:00.000Z",
  "path": "/admin/users"
}
```

**常见错误码**:
- `401`: 未登录或 Token 失效
- `403`: 权限不足 (非 ADMIN 角色)
- `404`: 资源不存在
- `400`: 请求参数错误
- `500`: 服务器内部错误

---

## 开发建议

1. **保存 Token**: 登录后保存 `accessToken` 和 `refreshToken`
2. **Token 过期处理**: `accessToken` 过期时使用 `refreshToken` 刷新
3. **权限验证**: 所有请求前确认用户 `role` 为 `ADMIN`
4. **错误处理**: 统一处理 401 和 403 错误,跳转到登录页

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-16
